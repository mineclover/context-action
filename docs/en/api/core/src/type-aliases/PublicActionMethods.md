[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / PublicActionMethods

# Type Alias: PublicActionMethods\<Actions, PublicKeys, ReturnMap\>

> **PublicActionMethods**\<`Actions`, `PublicKeys`, `ReturnMap`\> = \{ readonly \[Key in PublicKeys\]: \[Actions\[Key\]\] extends \[void \| undefined\] ? () =\> Key extends keyof ReturnMap ? Promise\<ReturnMap\[Key\]\> : Promise\<void\> : (payload: Actions\[Key\]) =\> Key extends keyof ReturnMap ? Promise\<ReturnMap\[Key\]\> : Promise\<void\> \}

Defined in: [packages/core/src/contracts/public-action-methods.ts:2](https://github.com/mineclover/context-action/blob/main/packages/core/src/contracts/public-action-methods.ts#L2)

Selected public commands; payload-less actions take no argument.

## Type Parameters

### Actions

`Actions` *extends* `object`

### PublicKeys

`PublicKeys` *extends* keyof `Actions` = keyof `Actions`

### ReturnMap

`ReturnMap` *extends* `Partial`\<`Record`\<`PublicKeys`, `unknown`\>\> = `Record`\<`never`, `never`\>
