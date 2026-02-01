import { getDMMF } from '@prisma/internals';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const dmmf = await getDMMF({ datamodel: schemaContent });

  console.log('=== User Model ===');
  const userModel = dmmf.datamodel.models.find((m: any) => m.name === 'User');
  if (userModel) {
    console.log('User primaryKey:', JSON.stringify(userModel.primaryKey, null, 2));
    console.log('User uniqueIndexes:', JSON.stringify(userModel.uniqueIndexes, null, 2));
    console.log('User uniqueFields:', JSON.stringify(userModel.uniqueFields, null, 2));
    console.log('All User properties:', Object.keys(userModel));
  }
}

main().catch(console.error);
