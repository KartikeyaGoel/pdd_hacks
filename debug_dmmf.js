const { getDMMF } = require('@prisma/internals');
const fs = require('fs');
const path = require('path');

async function main() {
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const dmmf = await getDMMF({ datamodel: schemaContent });

  console.log('=== User Model ===');
  const userModel = dmmf.datamodel.models.find(m => m.name === 'User');
  if (userModel) {
    console.log('All User properties:', Object.keys(userModel));
    console.log('\nUser model full:', JSON.stringify(userModel, null, 2));
  }
}

main().catch(console.error);
