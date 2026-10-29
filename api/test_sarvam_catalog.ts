import dotenv from 'dotenv';
dotenv.config({ path: 'C:/TF new V1/TrustForge/api/.env' });
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

async function inspectSarvamCatalog() {
  console.log('=== TASK 3: Inspect Sarvam AI Model Catalog for DeepSeek V4.1 Flash ===\n');
  const key = process.env.SARVAM_API_KEY;

  const res = await fetch('https://api.sarvam.ai/v1/models', {
    headers: {
      'api-subscription-key': key!,
      'Authorization': `Bearer ${key}`,
    },
  });

  console.log(`Sarvam /v1/models HTTP Status: ${res.status} ${res.statusText}`);
  if (res.ok) {
    const data = await res.json() as any;
    console.log('All models returned by Sarvam:');
    console.log(JSON.stringify(data, null, 2));

    const modelIds: string[] = (data.data || []).map((m: any) => m.id);
    const hasDeepSeek = modelIds.filter(id => id.toLowerCase().includes('deepseek'));
    console.log(`\nDeepSeek matches in Sarvam AI catalog:`, hasDeepSeek);
    console.log(`Does Sarvam host DeepSeek V4.1 Flash? ${hasDeepSeek.length > 0 ? 'YES' : 'NO'}`);
  } else {
    console.log('Error:', await res.text());
  }
}

inspectSarvamCatalog().catch(console.error);

