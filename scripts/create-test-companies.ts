import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from '../src/entities/smart-trash/user.entity';
import { CompanyEntity } from '../src/entities/smart-trash/company.entity';
import Entities from '../src/entities/entities';

const testCompanies = [
  {
    name: 'Эко-Технологии',
    description: 'Ведущая компания в области экологических технологий и переработки отходов. Специализируется на внедрении инновационных решений для устойчивого развития.',
    adminEmail: 'admin@ecotech.ru',
    adminPassword: 'test123',
    adminFullName: 'Иван Петров',
  },
  {
    name: 'Зелёный Офис',
    description: 'Крупная IT-компания, активно внедряющая экологические программы. Более 500 сотрудников используют систему раздельного сбора отходов.',
    adminEmail: 'admin@greenoffice.ru',
    adminPassword: 'test123',
    adminFullName: 'Мария Сидорова',
  },
  {
    name: 'Умный Город',
    description: 'Городская администрация, реализующая программу "Умный город" с фокусом на экологию. Пилотный проект по внедрению системы сортировки отходов.',
    adminEmail: 'admin@smartcity.ru',
    adminPassword: 'test123',
    adminFullName: 'Алексей Иванов',
  },
  {
    name: 'Эко-Маркет',
    description: 'Сеть супермаркетов, продвигающая экологически ответственное потребление. Внедрила систему сортировки отходов во всех филиалах.',
    adminEmail: 'admin@ecomarket.ru',
    adminPassword: 'test123',
    adminFullName: 'Елена Козлова',
  },
  {
    name: 'ТехноЭко',
    description: 'Производственная компания, специализирующаяся на переработке пластика. Использует систему для отслеживания качества сортировки сырья.',
    adminEmail: 'admin@technoeco.ru',
    adminPassword: 'test123',
    adminFullName: 'Дмитрий Волков',
  },
  {
    name: 'БиоЭнергия',
    description: 'Компания по производству биотоплива из органических отходов. Внедрила систему для оптимизации сбора и переработки органики.',
    adminEmail: 'admin@bioenergy.ru',
    adminPassword: 'test123',
    adminFullName: 'Ольга Новикова',
  },
  {
    name: 'Чистая Планета',
    description: 'Экологическая организация, занимающаяся просвещением и внедрением программ раздельного сбора. Работает с образовательными учреждениями.',
    adminEmail: 'admin@cleanplanet.ru',
    adminPassword: 'test123',
    adminFullName: 'Сергей Морозов',
  },
  {
    name: 'Эко-Логистика',
    description: 'Логистическая компания, специализирующаяся на перевозке и утилизации отходов. Использует систему для контроля и оптимизации маршрутов.',
    adminEmail: 'admin@ecologistics.ru',
    adminPassword: 'test123',
    adminFullName: 'Анна Соколова',
  },
];

async function createTestCompanies() {
  // Создаем подключение к базе данных
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5433,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1qa2ws3ed',
    database: process.env.DB_DATABASE || 'smart_trash_app_template_dev',
    entities: Entities,
    synchronize: true, // Включаем синхронизацию для создания недостающих колонок
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Подключение к базе данных установлено\n');

    const userRepository = dataSource.getRepository(UserEntity);
    const companyRepository = dataSource.getRepository(CompanyEntity);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const companyData of testCompanies) {
      const normalizedEmail = companyData.adminEmail.trim().toLowerCase();

      // Проверяем, существует ли пользователь
      let user = await userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (user) {
        // Обновляем существующего пользователя
        user.role = UserRole.ADMIN_COMPANY;
        user.isEmailConfirmed = true;
        user.isActive = true;
        user.passwordHash = companyData.adminPassword; // Будет захеширован в BeforeUpdate
        user.fullName = companyData.adminFullName;
        user = await userRepository.save(user);
        console.log(`🔄 Пользователь обновлен: ${normalizedEmail}`);
        updatedCount++;
      } else {
        // Создаем нового пользователя
        user = userRepository.create({
          email: normalizedEmail,
          passwordHash: companyData.adminPassword, // Будет захеширован в BeforeInsert
          fullName: companyData.adminFullName.trim(),
          role: UserRole.ADMIN_COMPANY,
          isActive: true,
          isEmailConfirmed: true,
          isEmployeeConfirmed: true,
        });
        user = await userRepository.save(user);
        console.log(`✅ Пользователь создан: ${normalizedEmail}`);
        createdCount++;
      }

      // Проверяем, существует ли компания
      let company = await companyRepository.findOne({
        where: { createdBy: { id: user.id } },
      });

      if (company) {
        // Обновляем существующую компанию
        company.name = companyData.name;
        company.description = companyData.description;
        company.isActive = true;
        company = await companyRepository.save(company);
        console.log(`   🔄 Компания обновлена: "${company.name}"`);
        skippedCount++;
      } else {
        // Создаем новую компанию
        company = companyRepository.create({
          name: companyData.name,
          description: companyData.description,
          createdBy: user,
          isActive: true,
        });
        company = await companyRepository.save(company);
        console.log(`   ✅ Компания создана: "${company.name}"`);
      }
      console.log('');
    }

    console.log('\n📊 Итоги:');
    console.log(`   ✅ Создано пользователей: ${createdCount}`);
    console.log(`   🔄 Обновлено пользователей: ${updatedCount}`);
    console.log(`   📝 Всего компаний: ${testCompanies.length}`);
    console.log(`   ⏭️  Пропущено (уже существовали): ${skippedCount}`);
    console.log('\n✅ Тестовые компании успешно созданы!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Ошибка при создании тестовых компаний:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Запускаем скрипт
createTestCompanies();

