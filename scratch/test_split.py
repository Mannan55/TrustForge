import sys
import re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.knowledge.build_authoritative_corpus import clean_gazette_text

txt_path = Path('backend/knowledge/sources/extracted/act_2023.txt')
with open(txt_path, 'r', encoding='utf-8') as f:
    raw = f.read()

cleaned = clean_gazette_text(raw)

s2_m = re.search(r'(?:^|\n)\s*2\.\s+', cleaned)
s3_m = re.search(r'(?:^|\n)\s*3\.\s+', cleaned)
s2_text = cleaned[s2_m.start():s3_m.start()].strip()
print('s2_text length:', len(s2_text))

ca = s2_text.find('(a) \u201cAppellate Tribunal\u201d')
ch = s2_text.find('(h) \u201cdata\u201d')
co = s2_text.find('(o) \u201cgain\u201d')
ct = s2_text.find('(t) \u201cpersonal data\u201d')

print('Indices:', ca, ch, co, ct)
print('Group 1 len:', ch - ca)
print('Group 2 len:', co - ch)
print('Group 3 len:', ct - co)
print('Group 4 len:', len(s2_text) - ct)

# Also test Section 6 and Section 8
s6_m = re.search(r'(?:^|\n)\s*6\.\s+', cleaned)
s7_m = re.search(r'(?:^|\n)\s*7\.\s+', cleaned)
s6_text = cleaned[s6_m.start():s7_m.start()].strip()
print('s6_text len:', len(s6_text))
s6_sub6 = s6_text.find('(6)')
print('s6_sub6 index:', s6_sub6)

s8_m = re.search(r'(?:^|\n)\s*8\.\s+', cleaned)
s9_m = re.search(r'(?:^|\n)\s*9\.\s+', cleaned)
s8_text = cleaned[s8_m.start():s9_m.start()].strip()
print('s8_text len:', len(s8_text))
s8_sub3 = s8_text.find('(3)')
s8_sub5 = s8_text.find('(5)')
s8_sub7 = s8_text.find('(7)')
s8_sub9 = s8_text.find('(9)')
print('s8 indices:', s8_sub3, s8_sub5, s8_sub7, s8_sub9)
