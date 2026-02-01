import { getDMMF } from '@prisma/internals';
import * as fs from 'fs';
import * as path from 'path';

describe('Prisma Schema Validation', () => {
  let dmmf: any;
  let schemaContent: string;

  beforeAll(async () => {
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    dmmf = await getDMMF({ datamodel: schemaContent });
  });

  describe('Database Configuration', () => {
    test('should use PostgreSQL as the database provider', () => {
      expect(schemaContent).toContain('provider = "postgresql"');
    });

    test('should configure DATABASE_URL environment variable', () => {
      expect(schemaContent).toContain('url      = env("DATABASE_URL")');
    });

    test('should have prisma-client-js generator', () => {
      expect(schemaContent).toContain('provider = "prisma-client-js"');
    });
  });

  describe('User Model', () => {
    let userModel: any;

    beforeAll(() => {
      userModel = dmmf.datamodel.models.find((m: any) => m.name === 'User');
    });

    test('should exist', () => {
      expect(userModel).toBeDefined();
    });

    test('should have id field with UUID default', () => {
      const idField = userModel.fields.find((f: any) => f.name === 'id');
      expect(idField).toBeDefined();
      expect(idField.type).toBe('String');
      expect(idField.isId).toBe(true);
      expect(idField.hasDefaultValue).toBe(true);
    });

    test('should have email field with unique constraint', () => {
      const emailField = userModel.fields.find((f: any) => f.name === 'email');
      expect(emailField).toBeDefined();
      expect(emailField.type).toBe('String');
      expect(emailField.isUnique).toBe(true);
      expect(emailField.isRequired).toBe(true);
    });

    test('should have name field as optional String', () => {
      const nameField = userModel.fields.find((f: any) => f.name === 'name');
      expect(nameField).toBeDefined();
      expect(nameField.type).toBe('String');
      expect(nameField.isRequired).toBe(false);
    });

    test('should have profile field as optional Json', () => {
      const profileField = userModel.fields.find((f: any) => f.name === 'profile');
      expect(profileField).toBeDefined();
      expect(profileField.type).toBe('Json');
      expect(profileField.isRequired).toBe(false);
    });

    test('should have createdAt field with default now()', () => {
      const createdAtField = userModel.fields.find((f: any) => f.name === 'createdAt');
      expect(createdAtField).toBeDefined();
      expect(createdAtField.type).toBe('DateTime');
      expect(createdAtField.hasDefaultValue).toBe(true);
    });

    test('should have updatedAt field with @updatedAt', () => {
      const updatedAtField = userModel.fields.find((f: any) => f.name === 'updatedAt');
      expect(updatedAtField).toBeDefined();
      expect(updatedAtField.type).toBe('DateTime');
      expect(updatedAtField.isUpdatedAt).toBe(true);
    });

    test('should have deletedAt field for soft delete', () => {
      const deletedAtField = userModel.fields.find((f: any) => f.name === 'deletedAt');
      expect(deletedAtField).toBeDefined();
      expect(deletedAtField.type).toBe('DateTime');
      expect(deletedAtField.isRequired).toBe(false);
    });

    test('should have conversations relation', () => {
      const conversationsField = userModel.fields.find((f: any) => f.name === 'conversations');
      expect(conversationsField).toBeDefined();
      expect(conversationsField.kind).toBe('object');
      expect(conversationsField.type).toBe('Conversation');
      expect(conversationsField.isList).toBe(true);
    });

    test('should have documents relation', () => {
      const documentsField = userModel.fields.find((f: any) => f.name === 'documents');
      expect(documentsField).toBeDefined();
      expect(documentsField.kind).toBe('object');
      expect(documentsField.type).toBe('Document');
      expect(documentsField.isList).toBe(true);
    });

    test('should have index on email', () => {
      const emailIndex = userModel.indexes?.find((idx: any) =>
        idx.fields.length === 1 && idx.fields[0] === 'email'
      );
      expect(emailIndex).toBeDefined();
    });

    test('should have index on createdAt', () => {
      const createdAtIndex = userModel.indexes?.find((idx: any) =>
        idx.fields.length === 1 && idx.fields[0] === 'createdAt'
      );
      expect(createdAtIndex).toBeDefined();
    });

    test('should map to users table', () => {
      expect(userModel.dbName).toBe('users');
    });
  });

  describe('Conversation Model', () => {
    let conversationModel: any;

    beforeAll(() => {
      conversationModel = dmmf.datamodel.models.find((m: any) => m.name === 'Conversation');
    });

    test('should exist', () => {
      expect(conversationModel).toBeDefined();
    });

    test('should have id field with UUID default', () => {
      const idField = conversationModel.fields.find((f: any) => f.name === 'id');
      expect(idField).toBeDefined();
      expect(idField.type).toBe('String');
      expect(idField.isId).toBe(true);
      expect(idField.hasDefaultValue).toBe(true);
    });

    test('should have userId field', () => {
      const userIdField = conversationModel.fields.find((f: any) => f.name === 'userId');
      expect(userIdField).toBeDefined();
      expect(userIdField.type).toBe('String');
      expect(userIdField.isRequired).toBe(true);
    });

    test('should have title field as optional String', () => {
      const titleField = conversationModel.fields.find((f: any) => f.name === 'title');
      expect(titleField).toBeDefined();
      expect(titleField.type).toBe('String');
      expect(titleField.isRequired).toBe(false);
    });

    test('should have summary field as optional Text', () => {
      const summaryField = conversationModel.fields.find((f: any) => f.name === 'summary');
      expect(summaryField).toBeDefined();
      expect(summaryField.type).toBe('String');
      expect(summaryField.isRequired).toBe(false);
    });

    test('should have startedAt field with default now()', () => {
      const startedAtField = conversationModel.fields.find((f: any) => f.name === 'startedAt');
      expect(startedAtField).toBeDefined();
      expect(startedAtField.type).toBe('DateTime');
      expect(startedAtField.hasDefaultValue).toBe(true);
    });

    test('should have endedAt field as optional DateTime', () => {
      const endedAtField = conversationModel.fields.find((f: any) => f.name === 'endedAt');
      expect(endedAtField).toBeDefined();
      expect(endedAtField.type).toBe('DateTime');
      expect(endedAtField.isRequired).toBe(false);
    });

    test('should have duration field as optional Int', () => {
      const durationField = conversationModel.fields.find((f: any) => f.name === 'duration');
      expect(durationField).toBeDefined();
      expect(durationField.type).toBe('Int');
      expect(durationField.isRequired).toBe(false);
    });

    test('should have deletedAt field for soft delete', () => {
      const deletedAtField = conversationModel.fields.find((f: any) => f.name === 'deletedAt');
      expect(deletedAtField).toBeDefined();
      expect(deletedAtField.type).toBe('DateTime');
      expect(deletedAtField.isRequired).toBe(false);
    });

    test('should have user relation with cascade delete', () => {
      const userField = conversationModel.fields.find((f: any) => f.name === 'user');
      expect(userField).toBeDefined();
      expect(userField.kind).toBe('object');
      expect(userField.type).toBe('User');
      expect(userField.relationOnDelete).toBe('Cascade');
    });

    test('should have messages relation', () => {
      const messagesField = conversationModel.fields.find((f: any) => f.name === 'messages');
      expect(messagesField).toBeDefined();
      expect(messagesField.kind).toBe('object');
      expect(messagesField.type).toBe('ConversationMessage');
      expect(messagesField.isList).toBe(true);
    });

    test('should have index on userId', () => {
      const userIdIndex = conversationModel.indexes?.find((idx: any) =>
        idx.fields.length === 1 && idx.fields[0] === 'userId'
      );
      expect(userIdIndex).toBeDefined();
    });

    test('should have index on startedAt', () => {
      const startedAtIndex = conversationModel.indexes?.find((idx: any) =>
        idx.fields.length === 1 && idx.fields[0] === 'startedAt'
      );
      expect(startedAtIndex).toBeDefined();
    });

    test('should have composite index on userId and startedAt', () => {
      const compositeIndex = conversationModel.indexes?.find((idx: any) =>
        idx.fields.length === 2 &&
        idx.fields.includes('userId') &&
        idx.fields.includes('startedAt')
      );
      expect(compositeIndex).toBeDefined();
    });

    test('should map to conversations table', () => {
      expect(conversationModel.dbName).toBe('conversations');
    });
  });

  describe('ConversationMessage Model', () => {
    let messageModel: any;

    beforeAll(() => {
      messageModel = dmmf.datamodel.models.find((m: any) => m.name === 'ConversationMessage');
    });

    test('should exist', () => {
      expect(messageModel).toBeDefined();
    });

    test('should have id field with UUID default', () => {
      const idField = messageModel.fields.find((f: any) => f.name === 'id');
      expect(idField).toBeDefined();
      expect(idField.type).toBe('String');
      expect(idField.isId).toBe(true);
      expect(idField.hasDefaultValue).toBe(true);
    });

    test('should have conversationId field', () => {
      const conversationIdField = messageModel.fields.find((f: any) => f.name === 'conversationId');
      expect(conversationIdField).toBeDefined();
      expect(conversationIdField.type).toBe('String');
      expect(conversationIdField.isRequired).toBe(true);
    });

    test('should have role field as String', () => {
      const roleField = messageModel.fields.find((f: any) => f.name === 'role');
      expect(roleField).toBeDefined();
      expect(roleField.type).toBe('String');
      expect(roleField.isRequired).toBe(true);
    });

    test('should have content field as Text', () => {
      const contentField = messageModel.fields.find((f: any) => f.name === 'content');
      expect(contentField).toBeDefined();
      expect(contentField.type).toBe('String');
      expect(contentField.isRequired).toBe(true);
    });

    test('should have timestamp field with default now()', () => {
      const timestampField = messageModel.fields.find((f: any) => f.name === 'timestamp');
      expect(timestampField).toBeDefined();
      expect(timestampField.type).toBe('DateTime');
      expect(timestampField.hasDefaultValue).toBe(true);
    });

    test('should have conversation relation with cascade delete', () => {
      const conversationField = messageModel.fields.find((f: any) => f.name === 'conversation');
      expect(conversationField).toBeDefined();
      expect(conversationField.kind).toBe('object');
      expect(conversationField.type).toBe('Conversation');
      expect(conversationField.relationOnDelete).toBe('Cascade');
    });

    test('should have index on conversationId', () => {
      const conversationIdIndex = messageModel.indexes?.find((idx: any) =>
        idx.fields.length === 1 && idx.fields[0] === 'conversationId'
      );
      expect(conversationIdIndex).toBeDefined();
    });

    test('should have composite index on conversationId and timestamp', () => {
      const compositeIndex = messageModel.indexes?.find((idx: any) =>
        idx.fields.length === 2 &&
        idx.fields.includes('conversationId') &&
        idx.fields.includes('timestamp')
      );
      expect(compositeIndex).toBeDefined();
    });

    test('should map to conversation_messages table', () => {
      expect(messageModel.dbName).toBe('conversation_messages');
    });
  });

  describe('Document Model', () => {
    let documentModel: any;

    beforeAll(() => {
      documentModel = dmmf.datamodel.models.find((m: any) => m.name === 'Document');
    });

    test('should exist', () => {
      expect(documentModel).toBeDefined();
    });

    test('should have id field with UUID default', () => {
      const idField = documentModel.fields.find((f: any) => f.name === 'id');
      expect(idField).toBeDefined();
      expect(idField.type).toBe('String');
      expect(idField.isId).toBe(true);
      expect(idField.hasDefaultValue).toBe(true);
    });

    test('should have userId field', () => {
      const userIdField = documentModel.fields.find((f: any) => f.name === 'userId');
      expect(userIdField).toBeDefined();
      expect(userIdField.type).toBe('String');
      expect(userIdField.isRequired).toBe(true);
    });

    test('should have name field as String', () => {
      const nameField = documentModel.fields.find((f: any) => f.name === 'name');
      expect(nameField).toBeDefined();
      expect(nameField.type).toBe('String');
      expect(nameField.isRequired).toBe(true);
    });

    test('should have category field as optional String', () => {
      const categoryField = documentModel.fields.find((f: any) => f.name === 'category');
      expect(categoryField).toBeDefined();
      expect(categoryField.type).toBe('String');
      expect(categoryField.isRequired).toBe(false);
    });

    test('should have contentType field as String', () => {
      const contentTypeField = documentModel.fields.find((f: any) => f.name === 'contentType');
      expect(contentTypeField).toBeDefined();
      expect(contentTypeField.type).toBe('String');
      expect(contentTypeField.isRequired).toBe(true);
    });

    test('should have uploadedAt field with default now()', () => {
      const uploadedAtField = documentModel.fields.find((f: any) => f.name === 'uploadedAt');
      expect(uploadedAtField).toBeDefined();
      expect(uploadedAtField.type).toBe('DateTime');
      expect(uploadedAtField.hasDefaultValue).toBe(true);
    });

    test('should have elevenLabsDocId field as optional unique String', () => {
      const elevenLabsDocIdField = documentModel.fields.find((f: any) => f.name === 'elevenLabsDocId');
      expect(elevenLabsDocIdField).toBeDefined();
      expect(elevenLabsDocIdField.type).toBe('String');
      expect(elevenLabsDocIdField.isRequired).toBe(false);
      expect(elevenLabsDocIdField.isUnique).toBe(true);
    });

    test('should have deletedAt field for soft delete', () => {
      const deletedAtField = documentModel.fields.find((f: any) => f.name === 'deletedAt');
      expect(deletedAtField).toBeDefined();
      expect(deletedAtField.type).toBe('DateTime');
      expect(deletedAtField.isRequired).toBe(false);
    });

    test('should have user relation with cascade delete', () => {
      const userField = documentModel.fields.find((f: any) => f.name === 'user');
      expect(userField).toBeDefined();
      expect(userField.kind).toBe('object');
      expect(userField.type).toBe('User');
      expect(userField.relationOnDelete).toBe('Cascade');
    });

    test('should have index on userId', () => {
      const userIdIndex = documentModel.indexes?.find((idx: any) =>
        idx.fields.length === 1 && idx.fields[0] === 'userId'
      );
      expect(userIdIndex).toBeDefined();
    });

    test('should have composite index on userId and uploadedAt', () => {
      const compositeIndex = documentModel.indexes?.find((idx: any) =>
        idx.fields.length === 2 &&
        idx.fields.includes('userId') &&
        idx.fields.includes('uploadedAt')
      );
      expect(compositeIndex).toBeDefined();
    });

    test('should have index on elevenLabsDocId', () => {
      const elevenLabsDocIdIndex = documentModel.indexes?.find((idx: any) =>
        idx.fields.length === 1 && idx.fields[0] === 'elevenLabsDocId'
      );
      expect(elevenLabsDocIdIndex).toBeDefined();
    });

    test('should map to documents table', () => {
      expect(documentModel.dbName).toBe('documents');
    });
  });

  describe('Model Relationships', () => {
    test('User should have one-to-many relationship with Conversation', () => {
      const userModel = dmmf.datamodel.models.find((m: any) => m.name === 'User');
      const conversationsField = userModel.fields.find((f: any) => f.name === 'conversations');
      expect(conversationsField.isList).toBe(true);
      expect(conversationsField.type).toBe('Conversation');
    });

    test('User should have one-to-many relationship with Document', () => {
      const userModel = dmmf.datamodel.models.find((m: any) => m.name === 'User');
      const documentsField = userModel.fields.find((f: any) => f.name === 'documents');
      expect(documentsField.isList).toBe(true);
      expect(documentsField.type).toBe('Document');
    });

    test('Conversation should have one-to-many relationship with ConversationMessage', () => {
      const conversationModel = dmmf.datamodel.models.find((m: any) => m.name === 'Conversation');
      const messagesField = conversationModel.fields.find((f: any) => f.name === 'messages');
      expect(messagesField.isList).toBe(true);
      expect(messagesField.type).toBe('ConversationMessage');
    });

    test('All foreign key relations should have onDelete: Cascade', () => {
      const conversationModel = dmmf.datamodel.models.find((m: any) => m.name === 'Conversation');
      const conversationUserField = conversationModel.fields.find((f: any) => f.name === 'user');
      expect(conversationUserField.relationOnDelete).toBe('Cascade');

      const messageModel = dmmf.datamodel.models.find((m: any) => m.name === 'ConversationMessage');
      const messageConversationField = messageModel.fields.find((f: any) => f.name === 'conversation');
      expect(messageConversationField.relationOnDelete).toBe('Cascade');

      const documentModel = dmmf.datamodel.models.find((m: any) => m.name === 'Document');
      const documentUserField = documentModel.fields.find((f: any) => f.name === 'user');
      expect(documentUserField.relationOnDelete).toBe('Cascade');
    });
  });

  describe('Schema Documentation', () => {
    test('should have comments for User model', () => {
      expect(schemaContent).toMatch(/\/\/\/.*User model.*stores user profile/i);
    });

    test('should have comments for Conversation model', () => {
      expect(schemaContent).toMatch(/\/\/\/.*Conversation model.*conversation sessions/i);
    });

    test('should have comments for ConversationMessage model', () => {
      expect(schemaContent).toMatch(/\/\/\/.*ConversationMessage model.*individual messages/i);
    });

    test('should have comments for Document model', () => {
      expect(schemaContent).toMatch(/\/\/\/.*Document model.*learning materials/i);
    });
  });

  describe('Schema Completeness', () => {
    test('should have exactly 4 models defined', () => {
      expect(dmmf.datamodel.models).toHaveLength(4);
      const modelNames = dmmf.datamodel.models.map((m: any) => m.name);
      expect(modelNames).toContain('User');
      expect(modelNames).toContain('Conversation');
      expect(modelNames).toContain('ConversationMessage');
      expect(modelNames).toContain('Document');
    });

    test('all models should use UUID for primary keys', () => {
      dmmf.datamodel.models.forEach((model: any) => {
        const idField = model.fields.find((f: any) => f.isId);
        expect(idField).toBeDefined();
        expect(idField.type).toBe('String');
        expect(idField.hasDefaultValue).toBe(true);
      });
    });

    test('all timestamp fields should be DateTime type', () => {
      const timestampFields = ['createdAt', 'updatedAt', 'deletedAt', 'startedAt', 'endedAt', 'uploadedAt', 'timestamp'];
      dmmf.datamodel.models.forEach((model: any) => {
        model.fields.forEach((field: any) => {
          if (timestampFields.includes(field.name)) {
            expect(field.type).toBe('DateTime');
          }
        });
      });
    });
  });
});
