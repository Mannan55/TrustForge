import csv

with open('docs/research/evaluation/results/rag_hybrid_comparison.csv', 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

print('=== 10 IMPROVED QUERIES ===')
for r in rows:
    if r['outcome'] == 'IMPROVED':
        print(f"ID: {r['query_id']} | Topic: {r['topic']}")
        print(f"  Query: {r['query']}")
        print(f"  Rank: {r['dense_rank']} -> {r['hybrid_rank']} (Hit@1: {r['dense_hit@1']} -> {r['hybrid_hit@1']})")
        print(f"  Top-1: {r['hybrid_top1']}")
        print()

print('=== 3 REGRESSED QUERIES ===')
for r in rows:
    if r['outcome'] == 'REGRESSED':
        print(f"ID: {r['query_id']} | Topic: {r['topic']}")
        print(f"  Query: {r['query']}")
        print(f"  Rank: {r['dense_rank']} -> {r['hybrid_rank']} (Hit@1: {r['dense_hit@1']} -> {r['hybrid_hit@1']})")
        print(f"  Top-1: {r['hybrid_top1']}")
        print()
