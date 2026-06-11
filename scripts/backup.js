// scripts/backup.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Проверка переменных окружения ===');
console.log(`SUPABASE_URL: ${supabaseUrl}`);
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL не задан');
  process.exit(1);
}
if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY не задан');
  process.exit(1);
}

// Очищаем возможные пробелы и кавычки
const cleanUrl = supabaseUrl.trim().replace(/\/$/, '');
const cleanKey = supabaseKey.trim();

console.log(`Очищенный URL: ${cleanUrl}`);
console.log(`Ключ (первые 10 символов): ${cleanKey.substring(0, 10)}...`);

const supabase = createClient(cleanUrl, cleanKey, {
  realtime: false,
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function backup() {
  console.log('\nНачинаем резервное копирование...');
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
    console.log(`\nЗагрузка таблицы ${table}...`);
    try {
      const { data: rows, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`❌ Ошибка при запросе ${table}:`, error.message);
        process.exit(1);
      }
      data[table] = rows;
      console.log(`  → получено ${rows.length} записей`);
    } catch (err) {
      console.error(`❌ Сетевая ошибка при запросе ${table}:`, err.message);
      process.exit(1);
    }
  }

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${now}.json`;
  const filePath = path.join(backupDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Резервная копия сохранена: ${fileName}`);
}

backup();