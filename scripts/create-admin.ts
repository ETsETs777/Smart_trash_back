import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from '../src/entities/smart-trash/user.entity';
import { CompanyEntity } from '../src/entities/smart-trash/company.entity';
import Entities from '../src/entities/entities';

async function createAdmin() {
  // Создаем подключение к базе данных
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5433,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1qa2ws3ed',
    database: process.env.DB_DATABASE || 'smart_trash_app_template_dev',
    entities: Entities,
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Подключение к базе данных установлено');

    const userRepository = dataSource.getRepository(UserEntity);
    const companyRepository = dataSource.getRepository(CompanyEntity);

    // Данные администратора
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smarttrash.ru';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminFullName = process.env.ADMIN_FULL_NAME || 'Администратор Системы';
    const companyName = process.env.ADMIN_COMPANY_NAME || 'Тестовая Компания';
    const companyDescription = process.env.ADMIN_COMPANY_DESCRIPTION || 'Тестовая компания для разработки';

    const normalizedEmail = adminEmail.trim().toLowerCase();

    // Проверяем, существует ли пользователь
    const existingUser = await userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      console.log(`⚠️  Пользователь с email ${normalizedEmail} уже существует`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Роль: ${existingUser.role}`);
      console.log(`   Email подтвержден: ${existingUser.isEmailConfirmed}`);
      
      // Обновляем существующего пользователя
      if (existingUser.role !== UserRole.ADMIN_COMPANY) {
        existingUser.role = UserRole.ADMIN_COMPANY;
        existingUser.isEmailConfirmed = true;
        existingUser.isActive = true;
        existingUser.passwordHash = adminPassword; // Будет захеширован в BeforeUpdate
        await userRepository.save(existingUser);
        console.log('✅ Пользователь обновлен до администратора');
      } else {
        // Обновляем пароль для существующего администратора
        existingUser.passwordHash = adminPassword; // Будет захеширован в BeforeUpdate
        existingUser.isEmailConfirmed = true;
        existingUser.isActive = true;
        await userRepository.save(existingUser);
        console.log('✅ Пароль администратора обновлен');
      }

      // Проверяем компанию
      const existingCompany = await companyRepository.findOne({
        where: { createdBy: { id: existingUser.id } },
      });

      if (!existingCompany) {
        const company = companyRepository.create({
          name: companyName,
          description: companyDescription,
          createdBy: existingUser,
          isActive: true,
        });
        await companyRepository.save(company);
        console.log(`✅ Компания "${companyName}" создана`);
      } else {
        console.log(`✅ Компания "${existingCompany.name}" уже существует`);
      }

      await dataSource.destroy();
      return;
    }

    // Создаем пользователя (пароль будет захеширован автоматически в BeforeInsert)
    const user = userRepository.create({
      email: normalizedEmail,
      passwordHash: adminPassword, // Будет захеширован в BeforeInsert
      fullName: adminFullName.trim(),
      role: UserRole.ADMIN_COMPANY,
      isActive: true,
      isEmailConfirmed: true, // Подтверждаем email сразу
      isEmployeeConfirmed: true,
    });

    const savedUser = await userRepository.save(user);
    console.log(`✅ Пользователь создан: ${savedUser.email}`);
    console.log(`   ID: ${savedUser.id}`);
    console.log(`   Роль: ${savedUser.role}`);

    // Создаем компанию
    const company = companyRepository.create({
      name: companyName,
      description: companyDescription,
      createdBy: savedUser,
      isActive: true,
    });

    const savedCompany = await companyRepository.save(company);
    console.log(`✅ Компания создана: ${savedCompany.name}`);
    console.log(`   ID: ${savedCompany.id}`);

    console.log('\n📋 Данные для входа:');
    console.log(`   Email: ${normalizedEmail}`);
    console.log(`   Пароль: ${adminPassword}`);
    console.log(`   Компания: ${companyName}`);
    console.log('\n✅ Администратор успешно создан!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Запускаем скрипт
createAdmin();

