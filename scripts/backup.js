// scripts/backup.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Проверка переменных окружения...');
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL не задан. Проверьте секреты GitHub.');
  process.exit(1);
}
if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY не задан. Проверьте секреты GitHub.');
  process.exit(1);
}

console.log(`SUPABASE_URL: ${supabaseUrl}`);
console.log(`Ключ: ${supabaseKey.substring(0, 10)}...`);

// Создаём клиент БЕЗ realtime (вебсокетов)
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: false,
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function backup() {
  console.log('Начинаем резервное копирование...');
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
    console.log(`Загрузка таблицы ${table}...`);
    const { data: rows, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Ошибка таблицы ${table}:`, error.message);
      process.exit(1);
    }
    data[table] = rows;
    console.log(`  → получено ${rows.length} записей`);
  }

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${now}.json`;
  const filePath = path.join(backupDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Резервная копия сохранена: ${fileName}`);
}

backup();