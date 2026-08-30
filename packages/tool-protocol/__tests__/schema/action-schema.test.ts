/**
 * Action Schema Tests
 *
 * Tests for Zod-based action definition system:
 * - defineAction creation and type inference
 * - Validation functions (validate, safeParse)
 * - Tool chain format converters (toMCP, toOpenAI, toAnthropic)
 * - createActionSchema for multiple actions
 * - createActionFactory helper
 */

import { z } from 'zod';
import {
  defineAction,
  createActionSchema,
  createActionFactory,
  zodToJsonSchema,
  type UnifiedAction,
  type ActionSchemaMap,
  type InferActionPayloadMap,
  type InferActionInputMap,
  type InferActionResultMap,
  type ActionFactory,
} from '../../src';

type Equal<Left, Right> = (
  <Value>() => Value extends Left ? 1 : 2
) extends (
  <Value>() => Value extends Right ? 1 : 2
)
  ? true
  : false;
type Assert<T extends true> = T;

describe('Action Schema', () => {
  describe('defineAction', () => {
    it('rejects empty action names before publishing a tool definition', () => {
      expect(() =>
        defineAction(
          { name: '   ', parameters: z.object({}) },
          z
        )
      ).toThrow('non-empty action name');

      expect(() =>
        defineAction(
          { name: 42 as never, parameters: z.object({}) },
          z
        )
      ).toThrow('non-empty action name');
    });

    it('should create a UnifiedAction with correct properties', () => {
      const action = defineAction(
        {
          name: 'testAction',
          description: 'Test action description',
          parameters: z.object({
            id: z.string(),
            count: z.number(),
          }),
        },
        z
      );

      expect(action.name).toBe('testAction');
      expect(action.description).toBe('Test action description');
      expect(action.zodSchema).toBeDefined();
      expect(action.jsonSchema).toBeDefined();
    });

    it('should work without description', () => {
      const action = defineAction(
        {
          name: 'noDescAction',
          parameters: z.object({
            value: z.string(),
          }),
        },
        z
      );

      expect(action.name).toBe('noDescAction');
      expect(action.description).toBeUndefined();
    });

    it('should generate valid JSON Schema', () => {
      const action = defineAction(
        {
          name: 'schemaTest',
          parameters: z.object({
            name: z.string(),
            age: z.number().optional(),
            active: z.boolean(),
          }),
        },
        z
      );

      const jsonSchema = action.toJSONSchema();

      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toBeDefined();
      expect(jsonSchema.properties?.name).toBeDefined();
      expect(jsonSchema.properties?.age).toBeDefined();
      expect(jsonSchema.properties?.active).toBeDefined();
      expect(jsonSchema.required).toContain('name');
      expect(jsonSchema.required).toContain('active');
      expect(jsonSchema.required).not.toContain('age');
    });

    it('should advertise an optional structured output schema', () => {
      const action = defineAction(
        {
          name: 'outputSchemaTest',
          parameters: z.object({ query: z.string() }),
          outputSchema: z.object({
            ok: z.boolean(),
            revision: z.number().int().nonnegative(),
          }),
        },
        z
      );

      expect(action.outputSchema).toMatchObject({
        type: 'object',
        properties: expect.objectContaining({
          ok: expect.any(Object),
          revision: expect.any(Object),
        }),
      });
      expect(action.toMCP().outputSchema).toEqual(action.outputSchema);
      expect(action.safeParseOutput?.({ ok: true, revision: 3 })).toMatchObject({
        success: true,
        data: { ok: true, revision: 3 },
      });
      expect(action.safeParseOutput?.({ ok: 'yes', revision: -1 })).toMatchObject({
        success: false,
      });
    });
  });

  describe('validate', () => {
    const action = defineAction(
      {
        name: 'validateTest',
        parameters: z.object({
          id: z.string().min(1),
          name: z.string().min(2).max(50),
          email: z.string().email().optional(),
        }),
      },
      z
    );

    it('should validate correct payload', () => {
      const result = action.validate({
        id: '123',
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toEqual({
        id: '123',
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should validate payload without optional fields', () => {
      const result = action.validate({
        id: '123',
        name: 'John',
      });

      expect(result).toEqual({
        id: '123',
        name: 'John',
      });
    });

    it('should throw on invalid payload', () => {
      expect(() => {
        action.validate({
          id: '', // min(1) violation
          name: 'John',
        });
      }).toThrow();
    });

    it('should throw on missing required fields', () => {
      expect(() => {
        action.validate({
          id: '123',
          // missing name
        });
      }).toThrow();
    });

    it('should throw on invalid email format', () => {
      expect(() => {
        action.validate({
          id: '123',
          name: 'John',
          email: 'invalid-email',
        });
      }).toThrow();
    });
  });

  describe('safeParse', () => {
    const action = defineAction(
      {
        name: 'safeParseTest',
        parameters: z.object({
          value: z.number().positive(),
        }),
      },
      z
    );

    it('should return success for valid payload', () => {
      const result = action.safeParse({ value: 42 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ value: 42 });
      }
    });

    it('should return error for invalid payload', () => {
      const result = action.safeParse({ value: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should return error for wrong type', () => {
      const result = action.safeParse({ value: 'not a number' });

      expect(result.success).toBe(false);
    });
  });

  describe('Tool Chain Format Converters', () => {
    const action = defineAction(
      {
        name: 'formatTest',
        description: 'Test format conversion',
        parameters: z.object({
          query: z.string(),
          limit: z.number().int().positive().optional(),
        }),
      },
      z
    );

    describe('toMCP', () => {
      it('should generate valid MCP tool definition', () => {
        const mcp = action.toMCP();

        expect(mcp.name).toBe('formatTest');
        expect(mcp.description).toBe('Test format conversion');
        expect(mcp.inputSchema).toBeDefined();
        expect(mcp.inputSchema.type).toBe('object');
        expect(mcp.inputSchema.properties?.query).toBeDefined();
      });
    });

    describe('toOpenAI', () => {
      it('should generate valid OpenAI tool definition', () => {
        const openai = action.toOpenAI();

        expect(openai.type).toBe('function');
        expect(openai.function.name).toBe('formatTest');
        expect(openai.function.description).toBe('Test format conversion');
        expect(openai.function.parameters).toBeDefined();
        expect(openai.function.parameters.type).toBe('object');
        expect(openai.function.parameters.properties).toBeDefined();
      });
    });

    describe('toAnthropic', () => {
      it('should generate valid Anthropic tool definition', () => {
        const anthropic = action.toAnthropic();

        expect(anthropic.name).toBe('formatTest');
        expect(anthropic.description).toBe('Test format conversion');
        expect(anthropic.input_schema).toBeDefined();
        expect(anthropic.input_schema.type).toBe('object');
      });
    });

    describe('toJSONSchema', () => {
      it('should return the same jsonSchema property', () => {
        const jsonSchema = action.toJSONSchema();

        expect(jsonSchema).toBe(action.jsonSchema);
      });
    });
  });

  describe('createActionSchema', () => {
    it('should create a schema map from multiple actions', () => {
      const updateUser = defineAction(
        {
          name: 'updateUser',
          parameters: z.object({
            id: z.string(),
            name: z.string(),
          }),
        },
        z
      );

      const deleteUser = defineAction(
        {
          name: 'deleteUser',
          parameters: z.object({
            id: z.string(),
            confirm: z.literal(true),
          }),
        },
        z
      );

      const schema = createActionSchema({
        updateUser,
        deleteUser,
      });

      expect(schema.updateUser).toBe(updateUser);
      expect(schema.deleteUser).toBe(deleteUser);
      expect(schema.updateUser.name).toBe('updateUser');
      expect(schema.deleteUser.name).toBe('deleteUser');
    });

    it('should preserve action functionality in schema map', () => {
      const action = defineAction(
        {
          name: 'test',
          parameters: z.object({ value: z.string() }),
        },
        z
      );

      const schema = createActionSchema({ test: action });

      const result = schema.test.safeParse({ value: 'hello' });
      expect(result.success).toBe(true);
    });

    it('rejects schema keys that do not match the canonical action name', () => {
      const action = defineAction(
        { name: 'canonicalName', parameters: z.object({}) },
        z
      );

      expect(() => createActionSchema({ alias: action })).toThrow(
        'must match the action name'
      );
    });
  });

  describe('createActionFactory', () => {
    it('should create a factory that binds zod module', () => {
      const define: ActionFactory = createActionFactory(z);

      const action = define({
        name: 'factoryAction',
        description: 'Created by factory',
        parameters: z.object({
          data: z.string(),
        }),
        outputSchema: z.object({ accepted: z.boolean() }),
      });

      expect(action.name).toBe('factoryAction');
      expect(action.description).toBe('Created by factory');
      expect(action.validate({ data: 'test' })).toEqual({ data: 'test' });
      const parsedOutput = action.safeParseOutput?.({ accepted: true });
      if (parsedOutput?.success) {
        const output: { accepted: boolean } = parsedOutput.data;
        expect(output).toEqual({ accepted: true });
      }
    });

    it('should work with multiple actions from same factory', () => {
      const define = createActionFactory(z);

      const action1 = define({
        name: 'action1',
        parameters: z.object({ a: z.number() }),
      });

      const action2 = define({
        name: 'action2',
        parameters: z.object({ b: z.string() }),
      });

      expect(action1.validate({ a: 1 })).toEqual({ a: 1 });
      expect(action2.validate({ b: 'test' })).toEqual({ b: 'test' });
    });
  });

  describe('zodToJsonSchema', () => {
    it('should convert Zod object schema to JSON Schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const jsonSchema = zodToJsonSchema(schema, z);

      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toBeDefined();
    });

    it('should handle nested objects', () => {
      const schema = z.object({
        user: z.object({
          id: z.string(),
          profile: z.object({
            name: z.string(),
          }),
        }),
      });

      const jsonSchema = zodToJsonSchema(schema, z);

      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties?.user).toBeDefined();
    });

    it('should handle arrays', () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      const jsonSchema = zodToJsonSchema(schema, z);

      expect(jsonSchema.properties?.items).toBeDefined();
    });
  });

  describe('Type Inference', () => {
    it('should infer payload and optional output schema types', () => {
      const schema = createActionSchema({
        createItem: defineAction(
          {
            name: 'createItem',
            parameters: z.object({
              title: z.string(),
              count: z.number().default(1),
            }),
            outputSchema: z.object({
              id: z.string(),
              createdAt: z.string(),
            }),
          },
          z
        ),
        deleteItem: defineAction(
          {
            name: 'deleteItem',
            parameters: z.object({
              id: z.string(),
            }),
          },
          z
        ),
      });

      type Actions = InferActionPayloadMap<typeof schema>;
      type Inputs = InferActionInputMap<typeof schema>;
      type Results = InferActionResultMap<typeof schema>;
      type CreateResultIsExact = Assert<Equal<Results['createItem'], {
        id: string;
        createdAt: string;
      }>>;
      type UnschematizedResultIsUnknown = Assert<Equal<Results['deleteItem'], unknown>>;
      type CreateInputAllowsDefaultOmission = Assert<Equal<Inputs['createItem'], {
        title: string;
        count?: number | undefined;
      }>>;

      // Type-level test: this should compile without errors
      const createPayload: Actions['createItem'] = {
        title: 'test',
        count: 1,
      };

      const deletePayload: Actions['deleteItem'] = {
        id: '123',
      };
      const createInput: Inputs['createItem'] = { title: 'test' };
      const createResult: Results['createItem'] = {
        id: 'item-1',
        createdAt: '2026-08-30T00:00:00.000Z',
      };
      const unschematizedResult: Results['deleteItem'] = { deleted: true };
      const typeAssertions: [
        CreateResultIsExact,
        UnschematizedResultIsUnknown,
        CreateInputAllowsDefaultOmission,
      ] = [true, true, true];

      const parsedOutput = schema.createItem.safeParseOutput?.(createResult);
      if (parsedOutput?.success) {
        const typedOutput: Results['createItem'] = parsedOutput.data;
        expect(typedOutput).toEqual(createResult);
      }

      expect(createPayload).toEqual({ title: 'test', count: 1 });
      expect(deletePayload).toEqual({ id: '123' });
      expect(createInput).toEqual({ title: 'test' });
      expect(unschematizedResult).toEqual({ deleted: true });
      expect(typeAssertions).toEqual([true, true, true]);
    });
  });
});
