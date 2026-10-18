import csv

with open('docs/research/evaluation/results/rag_results_v2_authoritative.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['query_id'] in ['rag_010', 'rag_011', 'rag_012', 'rag_013', 'rag_036', 'rag_037', 'rag_038', 'rag_039', 'rag_040', 'rag_041', 'rag_042', 'rag_043', 'rag_044', 'rag_045']:
            top1 = row['retrieved_chunk_ids'].split(';')[0].strip()
            print(f"{row['query_id']} ({row['topic']}): Hit@1={row['hit@1']}, Hit@5={row['hit@5']}, FirstRank={row['first_rel_rank']}, Top1={top1}, sim={row['top1_similarity']}")
