// scripts/backup.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Отсутствуют SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backup() {
  try {
    // Список всех таблиц
    const tables = [
      'profiles',
      'students',
      'groups',
      'group_students',
      'lessons',
      'subscriptions',
      'payments',
      'expenses',
      'salaries',
      'tasks',
    ];

    const data = {};

    for (const table of tables) {
      const { data: rows, error } = await supabase.from(table).select('*');
      if (error) throw error;
      data[table] = rows;
    }

    // Создаём папку backups, если её нет
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const now = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${now}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Резервная копия сохранена: ${fileName}`);
  } catch (err) {
    console.error('Ошибка резервного копирования:', err.message);
    process.exit(1);
  }
}

backup();