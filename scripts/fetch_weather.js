const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// 取得対象URL一覧（拡張しやすい形でURL＋フォーマット指定）
const URLS = [
  { key: 'advisor_tokyo', url: 'https://www.jma.go.jp/bosai/forecast/data/overview_forecast/130000.json', format: 'json' },
  { key: 'alerts_tokyo', url: 'https://www.jma.go.jp/bosai/warning/data/warning/130000.xml', format: 'xml' },
  { key: 'radarDirection', url: 'https://www.jma.go.jp/bosai/forecast/data/nowcast/010000.json', format: 'json' },
  { key: 'observation_tokyo', url: 'https://www.jma.go.jp/bosai/forecast/data/point/130000.json', format: 'json' }
];

// xml2jsパーサー設定（シンプルに）
const parser = new xml2js.Parser({ explicitArray: false });

async function fetchAndParse(url, format) {
  try {
    const res = await axios.get(url, { responseType: 'text' });
    if (format === 'json') {
      return JSON.parse(res.data);
    } else if (format === 'xml') {
      return await parser.parseStringPromise(res.data);
    } else {
      console.warn(`Unsupported format: ${format}`);
      return null;
    }
  } catch (e) {
    console.error(`Failed to fetch or parse ${url}:`, e.message);
    return null;
  }
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  for (const { key, url, format } of URLS) {
    console.log(`Fetching [${format.toUpperCase()}] ${key} from ${url} ...`);
    const data = await fetchAndParse(url, format);
    if (!data) {
      console.warn(`Skipping ${key} due to fetch/parse failure.`);
      continue;
    }

    // XMLの場合は必要に応じて構造変換・抽出して整形可能
    // 今回はそのまま保存（巨大すぎる場合は加工検討）

    const savePath = path.join(DATA_DIR, `${key}.json`);
    await fs.writeFile(savePath, JSON.stringify(data, null, 2));
    console.log(`Saved data to ${savePath}`);
  }
}

main();
