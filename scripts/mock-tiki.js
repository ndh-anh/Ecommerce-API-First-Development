require("dotenv").config();
const { Client } = require("pg");
const crypto = require("crypto");

const client = new Client({
  host: process.env.DB_HOST || "aws-0-ap-northeast-1.pooler.supabase.com",
  port: process.env.DB_PORT || 6543,
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USERNAME || process.env.POSTGRES_USER,
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const TIKI_CATEGORY_IDS = [
  { id: 1883, name: "Nhà Cửa - Đời Sống" },
  { id: 1815, name: "Thiết Bị Số - Phụ Kiện Số" },
  { id: 4221, name: "Điện Thoại - Máy Tính Bảng" },
  { id: 8322, name: "Nhà Sách Tiki" },
  { id: 4384, name: "Giày - Dép Nam" },
  { id: 976, name: "Thời trang nữ" },
  { id: 1882, name: "Điện Gia Dụng" },
  { id: 2549, name: "Đồ Chơi - Mẹ & Bé" },
  { id: 1520, name: "Làm Đẹp - Sức Khỏe" },
  { id: 915, name: "Thời trang nam" },
  { id: 8594, name: "Ô Tô - Xe Máy" },
  { id: 17166, name: "Bách Hóa Online" },
  { id: 1789, name: "Đồng hồ và Trang sức" },
  { id: 1975, name: "Thể Thao - Dã Ngoại" },
  { id: 11312, name: "Balo và Vali" },
  { id: 27616, name: "Chăm sóc nhà cửa" },
  { id: 8371, name: "Văn phòng phẩm" },
  { id: 28022, name: "Phụ kiện ô tô" },
  { id: 44792, name: "Đồ hộp và đóng gói" },
];

async function fetchTikiProducts(categoryName) {
  const url = `https://tiki.vn/api/v2/products?limit=25&q=${encodeURIComponent(categoryName)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}

function slugify(text) {
  if (!text) return crypto.randomUUID();
  const base = text
    .toString()
    .toLowerCase()
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "a")
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "e")
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, "i")
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "o")
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "u")
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, "y")
    .replace(/đ/gi, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

async function run() {
  await client.connect();
  console.log("Connected to DB");

  let totalProducts = 0;

  for (const cat of TIKI_CATEGORY_IDS) {
    if (totalProducts >= 300) break;

    console.log(`Processing category: ${cat.name}`);
    const catId = crypto.randomUUID();
    const catSlug = slugify(cat.name);

    try {
      await client.query(
        `
        INSERT INTO categories (id, name, slug) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (name) DO NOTHING
      `,
        [catId, cat.name, catSlug],
      );
    } catch (e) {}

    const catRes = await client.query(
      "SELECT id FROM categories WHERE name = $1",
      [cat.name],
    );
    if (catRes.rowCount === 0) continue;
    const dbCatId = catRes.rows[0].id;

    const products = await fetchTikiProducts(cat.name);
    console.log(`Got ${products.length} products`);

    for (const p of products) {
      if (totalProducts >= 300) break;

      const brandName = p.brand_name || "Generic";
      const brandSlug = slugify(brandName);
      const brandId = crypto.randomUUID();

      try {
        await client.query(
          `
           INSERT INTO brands (id, name, slug) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (name) DO NOTHING
         `,
          [brandId, brandName, brandSlug],
        );
      } catch (e) {}

      const brandRes = await client.query(
        "SELECT id FROM brands WHERE name = $1",
        [brandName],
      );
      const dbBrandId = brandRes.rows[0]?.id || null;

      const productId = crypto.randomUUID();
      const productSlug = slugify(p.name);

      try {
        await client.query(
          `
           INSERT INTO products (id, category_id, brand_id, name, slug, thumbnail_url, description, is_published, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         `,
          [
            productId,
            dbCatId,
            dbBrandId,
            p.name,
            productSlug,
            p.thumbnail_url,
            p.short_description || p.name,
            true,
          ],
        );
      } catch (e) {
        continue;
      }

      const variantId = crypto.randomUUID();
      const sku = p.sku || crypto.randomUUID().substring(0, 8);
      try {
        await client.query(
          `
            INSERT INTO product_variants (id, product_id, sku, thumbnail_url, price, compare_price, stock, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `,
          [
            variantId,
            productId,
            sku,
            p.thumbnail_url,
            p.price,
            p.original_price || p.price,
            p.stock_item?.qty || 100,
          ],
        );
      } catch (e) {}

      totalProducts++;
    }
    console.log(`Progress: ${totalProducts}/300`);
  }

  await client.end();
  console.log("Finished mocking data!");
}

run().catch(console.error);
