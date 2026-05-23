import httpx, asyncio

async def test():
    async with httpx.AsyncClient() as c:
        r1 = await c.get("http://localhost:3000/api/public/products")
        products = r1.json()
        product_id = products[0]["id"]
        print(f"Product: {products[0]['name']}")

        r2 = await c.post("http://localhost:3000/api/public/orders", json={
            "customer_name": "Test User",
            "customer_phone": "123456789",
            "channel": "TAKEAWAY",
            "items": [{"product_id": product_id, "quantity": 2}]
        })
        print(f"Status: {r2.status_code}")
        print(f"Body: {r2.text[:500]}")

        if r2.status_code == 201:
            r3 = await c.post("http://localhost:3000/api/auth/login", 
                json={"email": "admin@foodstore.com", "password": "admin123"})
            token = r3.json()["token"]
            r4 = await c.get("http://localhost:3000/api/orders",
                headers={"Authorization": f"Bearer {token}"})
            print(f"\nOrders in business: {len(r4.json())}")

asyncio.run(test())
