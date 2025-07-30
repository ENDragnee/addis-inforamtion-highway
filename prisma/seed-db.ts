import { PrismaClient } from '../src/generated/prisma/client';
// Adjust the import path if your password utility is located elsewhere
import { hashPassword } from '../src/lib/password-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database...');
  // Delete in reverse order of creation to avoid foreign key constraints
  await prisma.dataRequest.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.institutionUser.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.role.deleteMany();
  await prisma.dataSchema.deleteMany();
  await prisma.user.deleteMany();
  await prisma.superUser.deleteMany();
  console.log('✅ Database cleaned');

  console.log('🌱 Seeding database...');

  // --- Hashed Passwords ---
  const superUserPassword = await hashPassword('superadmin123');
  const institutionUserPassword = await hashPassword('password123');
  const clientSecretHash = await hashPassword('super-secret-client-secret');

  // 1. --- Super User ---
  console.log('👤 Creating Super User...');
  await prisma.superUser.create({
    data: {
      email: 'admin@super.com',
      name: 'Super Admin',
      hashedPassword: superUserPassword,
      role: 'SUPER_ADMIN',
    },
  });

  // 2. --- Roles ---
  console.log('🏷️ Creating Roles...');
  const bankRole = await prisma.role.create({
    data: {
      name: 'Bank',
      description: 'Financial institutions that provide banking services.',
    },
  });
  const govRole = await prisma.role.create({
    data: {
      name: 'Government Agency',
      description: 'Official government bodies providing public services.',
    },
  });
  const telcoRole = await prisma.role.create({
    data: {
      name: 'Telecommunications',
      description: 'Companies that provide communication services.',
    },
  });

  // 3. --- Data Schemas ---
  console.log('📄 Creating Data Schemas...');
  const kycSchema = await prisma.dataSchema.create({
    data: {
      schemaId: 'schema:identity:kyc:v1',
      description: 'Know Your Customer - Full identity verification data.',
    },
  });
  const addressSchema = await prisma.dataSchema.create({
    data: {
      schemaId: 'schema:address:proof:v1',
      description: 'Proof of Address - Validated residential address.',
    },
  });
  const creditScoreSchema = await prisma.dataSchema.create({
    data: {
      schemaId: 'schema:finance:credit-score:v1',
      description: 'Credit Score - A numerical expression of creditworthiness.',
    },
  });


  // 4. --- Institutions ---
  console.log('🏢 Creating Institutions...');
  const bankInstitution = await prisma.institution.create({
    data: {
      name: 'Verifayda Bank',
      roleId: bankRole.id,
      clientSecretHash: clientSecretHash,
      publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
      apiEndpoint: 'https://api.verifaydabank.com/v1',
    },
  });

  const govInstitution = await prisma.institution.create({
    data: {
      name: 'National Identity Agency',
      roleId: govRole.id,
      clientSecretHash: await hashPassword('another-secret-123'),
      publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
      apiEndpoint: 'https://api.nia.gov/v1',
    },
  });
  
  const telcoInstitution = await prisma.institution.create({
    data: {
      name: 'ConnectaTel',
      roleId: telcoRole.id,
      clientSecretHash: await hashPassword('telco-secret-456'),
      publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
      apiEndpoint: 'https://api.connectatel.com/v1',
    },
  });

  // 5. --- Institution Users ---
  console.log('🧑‍💼 Creating Institution Users...');
  await prisma.institutionUser.create({
    data: {
      email: 'admin@verifaydabank.com',
      name: 'Bank Admin',
      hashedPassword: institutionUserPassword,
      institutionId: bankInstitution.id,
      role: 'ADMIN',
    },
  });

  await prisma.institutionUser.create({
    data: {
      email: 'officer@nia.gov',
      name: 'Gov Officer',
      hashedPassword: institutionUserPassword,
      institutionId: govInstitution.id,
      role: 'ADMIN',
    },
  });

  // 6. --- End Users (Data Owners) ---
  console.log('👥 Creating End Users...');
  const userAlice = await prisma.user.create({
    data: {
      externalId: 'ext_alice_12345',
      verifaydaSub: 'sub_alice_abcdef',
    },
  });

  const userBob = await prisma.user.create({
    data: {
      externalId: 'ext_bob_67890',
      verifaydaSub: 'sub_bob_ghijkl',
    },
  });

  // 7. --- Relationships ---
  console.log('🤝 Creating Relationships...');
  // Bank can request KYC data from Government
  await prisma.relationship.create({
    data: {
      requesterRoleId: bankRole.id,
      providerRoleId: govRole.id,
      dataSchemaId: kycSchema.id,
      status: 'ACTIVE',
    },
  });
  // Bank can request Address data from Telecommunications
  await prisma.relationship.create({
    data: {
      requesterRoleId: bankRole.id,
      providerRoleId: telcoRole.id,
      dataSchemaId: addressSchema.id,
      status: 'ACTIVE',
    },
  });

  // 8. --- Data Requests ---
  console.log('🔄 Creating Data Requests...');
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  // A completed request
  await prisma.dataRequest.create({
    data: {
      requesterId: bankInstitution.id,
      providerId: govInstitution.id,
      dataOwnerId: userAlice.id,
      dataSchemaId: kycSchema.id,
      status: 'COMPLETED',
      expiresAt: thirtyDaysFromNow,
    },
  });

  // A request awaiting user consent
  await prisma.dataRequest.create({
    data: {
      requesterId: bankInstitution.id,
      providerId: telcoInstitution.id,
      dataOwnerId: userBob.id,
      dataSchemaId: addressSchema.id,
      status: 'AWAITING_CONSENT',
      expiresAt: thirtyDaysFromNow,
    },
  });
  
  // A failed request
   await prisma.dataRequest.create({
    data: {
      requesterId: bankInstitution.id,
      providerId: govInstitution.id,
      dataOwnerId: userBob.id,
      dataSchemaId: kycSchema.id,
      status: 'FAILED',
      failureReason: 'User data not found at provider.',
      expiresAt: thirtyDaysFromNow,
    },
  });


  console.log('✅ Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ An error occurred while seeding the database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
