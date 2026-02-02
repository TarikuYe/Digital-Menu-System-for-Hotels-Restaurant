import pool from './config/database.js';

const upgradeMenu = async () => {
    const foods = [
        {
            name: 'Emergency Burger',
            new_name: 'Signature Wagyu Burger',
            description: 'Double-stack premium Wagyu beef, truffle aioli, vintage cheddar, and caramelized balsamic onions on a toasted brioche bun.',
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Spring Rolls',
            new_name: 'Crispy Vegetable Spring Rolls',
            description: 'Hand-rolled golden pastry filled with garden-fresh vegetables and glass noodles, served with a house-made sweet chili ginger glaze.',
            image_url: 'https://images.unsplash.com/photo-1544510808-91bcbee1df55?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Grilled Chicken',
            new_name: 'Herb-Roasted Chicken Breast',
            description: 'Tender chicken breast marinated in Mediterranean herbs, grilled to perfection, served with a side of micro-greens and citrus vinaigrette.',
            image_url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Cola',
            new_name: 'Vintage Craft Cola',
            description: 'Classic refreshing soda served chilled with a hint of natural vanilla and served over artisanal ice spheres.',
            image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32a597e?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Beef Curry',
            new_name: 'Slow-Braised Beef Curry',
            description: 'Succulent chunks of beef simmered for 8 hours in a rich, aromatic blend of 12 spices, coconut milk, and fresh herbs.',
            image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Chocolate Cake',
            new_name: 'Molten Belgian Chocolate Cake',
            description: 'A rich dark chocolate heart with a soft sponge exterior, finished with a dusting of gold leaf and Madagascan vanilla cream.',
            image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80'
        }
    ];

    try {
        for (const food of foods) {
            await pool.query(
                'UPDATE foods SET name = $1, description = $2, image_url = $3 WHERE name = $4',
                [food.new_name, food.description, food.image_url, food.name]
            );
        }
        console.log('✅ Menu upgraded with premium descriptions and images');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

upgradeMenu();
