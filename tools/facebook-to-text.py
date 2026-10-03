"""Turns a Facebook "Download your information" Messages export into plain, anonymised text
files for drafting FAQ rows. Runs offline with Python 3.8+ and no extra packages.

    py facebook-to-text.py <export .zip or unzipped folder> <output folder> [--page "Page name"]

Each output file holds up to 25 conversations, oldest message first, with turns labelled
"Viện:" or "Học viên:". Learner names (as Facebook lists them), emails, phone numbers and ID
numbers are replaced; names written inside a message are not, so read the result before
sharing it. Keep the export and the output on the institute's own machine.
"""

import argparse
import collections
import datetime
import json
import os
import re
import sys
import zipfile

OWN_NUMBERS = {'02822426789', '0949761636', '0912114511'}
PER_FILE = 25

# The same rules as maskPersonal_ in apps-script/Chat.gs.
EMAIL = re.compile(r'[\w.+-]+@[\w-]+(?:\.[\w-]+)+')
PHONE = re.compile(r'(?<![\d.,])(?:(?:\(\+?84\)|\+84|84)[\s.\-]?(?:\(0\)[\s.\-]?)?|\(?0)\d(?:\)?[\s.\-]?\d){7,9}(?!\d|[.,]\d)')
GROUPED_ID = re.compile(r'(?<![\d.,])(?<!84[\s.\-])(?<!84\)[\s.\-])\d{3,4}(?:[ \-]\d{3,4}){2,3}(?!\d|[.,]\d|[ \-]\d)')
PLAIN_ID = re.compile(r'(?<![\d.,])(?:\d{12}|\d{9})(?!\d|[.,]\d)')


def mask_phone(match):
    found = match.group(0)
    digits = re.sub(r'^840?', '0', re.sub(r'\D', '', found))
    if len(digits) < 10 or len(digits) > 11 or digits in OWN_NUMBERS:
        return found
    return '[số điện thoại]'


def mask_grouped_id(match):
    found = match.group(0)
    return '[số giấy tờ]' if len(re.sub(r'\D', '', found)) in (9, 12) else found


def mask(text):
    text = EMAIL.sub('[email]', text)
    text = PHONE.sub(mask_phone, text)
    text = GROUPED_ID.sub(mask_grouped_id, text)
    return PLAIN_ID.sub('[số giấy tờ]', text)


def fix_text(value):
    # Facebook writes UTF-8 bytes as if each were a Latin-1 character ("Há»c" for "Học").
    try:
        return value.encode('latin-1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return value


def read_threads(source):
    """Yields (thread folder, parsed JSON) for every messages/**/message_N.json."""
    pattern = re.compile(r'(^|/)messages/.*/message_\d+\.json$')
    if zipfile.is_zipfile(source):
        with zipfile.ZipFile(source) as archive:
            for name in archive.namelist():
                if pattern.search(name):
                    yield os.path.dirname(name), json.loads(archive.read(name).decode('utf-8'))
        return
    for root, _, files in os.walk(source):
        for name in files:
            path = os.path.join(root, name)
            if pattern.search(path.replace(os.sep, '/')):
                with open(path, encoding='utf-8') as handle:
                    yield root, json.load(handle)


def load(source):
    threads = collections.defaultdict(lambda: {'people': set(), 'messages': []})
    for folder, data in read_threads(source):
        thread = threads[folder]
        thread['people'].update(fix_text(p.get('name', '')) for p in data.get('participants', []))
        for message in data.get('messages', []):
            content = message.get('content')
            if isinstance(content, str) and content.strip():
                thread['messages'].append((message.get('timestamp_ms', 0), fix_text(message.get('sender_name', '')), fix_text(content)))
    return list(threads.values())


def guess_page(threads):
    # The Page takes part in every conversation; a learner usually in one.
    counts = collections.Counter(name for thread in threads for name in thread['people'] if name)
    return counts.most_common(1)[0][0] if counts else ''


def render(thread, page, number):
    messages = sorted(thread['messages'])
    # Only full names of two or more words: a one-word name ("An") also occurs inside ordinary text.
    names = sorted((n for n in thread['people'] if n and n != page and ' ' in n.strip()), key=len, reverse=True)
    when = datetime.datetime.fromtimestamp(messages[0][0] / 1000).strftime('%m/%Y')
    lines = ['=== Hội thoại %d (%s) ===' % (number, when)]
    for _, sender, content in messages:
        for name in names:
            content = re.sub(r'(?<!\w)' + re.escape(name) + r'(?!\w)', '[tên]', content)
        lines.append(('Viện: ' if sender == page else 'Học viên: ') + mask(content))
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Anonymise a Facebook Messages export for FAQ drafting.')
    parser.add_argument('source', help='the downloaded .zip, or the folder it was unzipped to')
    parser.add_argument('output', help='folder for the text files (created if missing)')
    parser.add_argument('--page', help="the Page's name exactly as Facebook shows it (guessed if left out)")
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(errors='replace')

    threads = load(args.source)
    page = args.page or guess_page(threads)
    # Keep conversations where a learner actually wrote something.
    threads = [t for t in threads if any(sender != page for _, sender, _ in t['messages'])]
    threads.sort(key=lambda t: min(m[0] for m in t['messages']))
    if not threads:
        sys.exit('No conversations found. Check that the export includes Messages in JSON format.')

    os.makedirs(args.output, exist_ok=True)
    blocks = [render(t, page, i + 1) for i, t in enumerate(threads)]
    files = 0
    for start in range(0, len(blocks), PER_FILE):
        files += 1
        path = os.path.join(args.output, 'hoi-thoai-%03d.txt' % files)
        with open(path, 'w', encoding='utf-8') as handle:
            handle.write('\n\n'.join(blocks[start:start + PER_FILE]) + '\n')
    print('Page: %s' % page)
    print('%d conversations written to %d files in %s' % (len(blocks), files, args.output))
    print('Read them before use: names written inside messages are not removed.')


if __name__ == '__main__':
    main()
