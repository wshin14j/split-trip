// Cloudflare Pages Function — 台灣銀行牌告匯率「現金賣出」中繼
// 路徑：/bank-rates（同源，供前端 fetchLiveRates 呼叫，避開跨域與台銀反爬）
// 台銀 CSV 每列欄位：幣別代碼, 現金買入, 現金賣出, 即期買入, 即期賣出, ...（現金賣出=index 2）
// ?raw=1 直接回傳台銀原始 CSV，方便部署後對照欄位是否正確

export async function onRequest(context) {
  const CSV_URL = 'https://rate.bot.com.tw/xrt/flcsv/0/day';
  try {
    const upstream = await fetch(CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/csv,text/plain,*/*',
        'Accept-Language': 'zh-TW,zh;q=0.9',
        'Referer': 'https://rate.bot.com.tw/xrt?Lang=zh-TW'
      }
    });
    const text = await upstream.text();
    const url = new URL(context.request.url);

    // 除錯：直接看台銀原始 CSV
    if (url.searchParams.get('raw') === '1') {
      return new Response(text, {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' }
      });
    }

    // 解析：取每個幣別的「現金賣出」（第 3 欄），不收現金者退回「即期賣出」（第 5 欄）
    const lines = text.trim().split(/\r?\n/);
    const rates = {};
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length < 5) continue;
      const code = (cols[0] || '').trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) continue;
      let sell = parseFloat(cols[2]);            // 現金賣出
      if (!(sell > 0)) sell = parseFloat(cols[4]); // 退回：即期賣出
      if (sell > 0) rates[code] = sell;
    }

    const body = {
      source: '台灣銀行牌告匯率（現金賣出）',
      fetchedAt: new Date().toISOString(),
      count: Object.keys(rates).length,
      rates
    };
    const ok = body.count > 0;
    return new Response(JSON.stringify(body), {
      status: ok ? 200 : 502,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=1800'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
    });
  }
}
