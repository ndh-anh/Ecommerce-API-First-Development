const { Client } = require("pg");
const crypto = require("crypto");

const client = new Client({
  host: "aws-0-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.ztzaeqprsfmluglnchir",
  password: "5qTpequyyOYrGzii",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log("✅ Connected to DB");

  // 1. Create a Warehouse if not exists
  let warehouseId;
  const whRes = await client.query("SELECT id FROM warehouses LIMIT 1");
  if (whRes.rowCount === 0) {
    warehouseId = crypto.randomUUID();
    await client.query(
      `
      INSERT INTO warehouses (id, name, address, created_at)
      VALUES ($1, $2, $3, NOW())
    `,
      [warehouseId, "Kho Tổng Tiki", "123 Đường Tiki, TP HCM"],
    );
    console.log("✅ Created default warehouse: Kho Tổng Tiki");
  } else {
    warehouseId = whRes.rows[0].id;
    console.log("✅ Using existing warehouse:", warehouseId);
  }

  // 2. Mock Inventory for all product_variants
  const variants = await client.query("SELECT id FROM product_variants");
  let inventoryCount = 0;
  for (const v of variants.rows) {
    const invRes = await client.query(
      "SELECT 1 FROM warehouse_inventory WHERE warehouse_id = $1 AND product_variant_id = $2",
      [warehouseId, v.id],
    );
    if (invRes.rowCount === 0) {
      // Random stock between 10 and 200
      const stock = Math.floor(Math.random() * 190) + 10;
      await client.query(
        `
         INSERT INTO warehouse_inventory (warehouse_id, product_variant_id, stock)
         VALUES ($1, $2, $3)
       `,
        [warehouseId, v.id, stock],
      );
      inventoryCount++;
    }
  }
  console.log(`✅ Mocked inventory for ${inventoryCount} product variants`);

  // 3. Mock Images for all products
  const products = await client.query("SELECT id, thumbnail_url FROM products");
  let imageCount = 0;
  for (const p of products.rows) {
    const existingImgs = await client.query(
      "SELECT 1 FROM product_images WHERE product_id = $1",
      [p.id],
    );
    if (existingImgs.rowCount === 0) {
      // Insert main image (thumbnail)
      await client.query(
        `
         INSERT INTO product_images (id, product_id, url, is_thumbnail, sort_order, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
       `,
        [crypto.randomUUID(), p.id, p.thumbnail_url, true, 1],
      );

      // Insert dummy extra images for carousel using the thumbnail image instead of placeholders
      const dummyImage2 = p.thumbnail_url;
      await client.query(
        `
         INSERT INTO product_images (id, product_id, url, is_thumbnail, sort_order, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
       `,
        [crypto.randomUUID(), p.id, dummyImage2, false, 2],
      );

      const dummyImage3 = p.thumbnail_url;
      await client.query(
        `
         INSERT INTO product_images (id, product_id, url, is_thumbnail, sort_order, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
       `,
        [crypto.randomUUID(), p.id, dummyImage3, false, 3],
      );

      imageCount += 3;
    }
  }
  console.log(`✅ Mocked ${imageCount} extra images for products`);

  await client.end();
  console.log("🎉 Finished mocking images and inventory!");
}

run().catch(console.error);
