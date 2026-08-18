import db from './db.js';

const run = async () => {
    try {
        console.log("Running DB update for payments table...");
        
        // Add slip_url column if not exists
        await new Promise((resolve, reject) => {
            db.query("ALTER TABLE payments ADD COLUMN slip_url VARCHAR(300) DEFAULT NULL AFTER invoice_link", (err, result) => {
                if (err && !err.message.includes("Duplicate column name")) {
                    console.error("Error adding slip_url:", err);
                    reject(err);
                } else {
                    console.log("Column slip_url added or already exists.");
                    resolve();
                }
            });
        });

        // Add payment_method column if not exists
        await new Promise((resolve, reject) => {
            db.query("ALTER TABLE payments ADD COLUMN payment_method VARCHAR(20) DEFAULT 'card' AFTER amount", (err, result) => {
                if (err && !err.message.includes("Duplicate column name")) {
                    console.error("Error adding payment_method:", err);
                    reject(err);
                } else {
                    console.log("Column payment_method added or already exists.");
                    resolve();
                }
            });
        });

        console.log("DB update completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("DB update failed:", error);
        process.exit(1);
    }
};

run();
