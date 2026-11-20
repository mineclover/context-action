[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / createTimeTravel

# Function: createTimeTravel()

Create a TimeTravel instance

## Call Signature

> **createTimeTravel**\<`S`, `F`, `P`\>(`initialState`, `options?`): [`TimeTravel`](../classes/TimeTravel.md)\<`S`, `F`, `true`, `P`\>

Defined in: [packages/mutative/src/time-travel.ts:1045](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L1045)

Create a TimeTravel instance with auto archive mode

### Type Parameters

#### S

Type parameter **S**

#### F

`F` *extends* `boolean` = `false`

#### P

`P` *extends* `object` = `object`

### Parameters

#### initialState

Type parameter **S**

#### options?

`Omit`\<[`TimeTravelOptions`](../type-aliases/TimeTravelOptions.md)\<`F`, `true`, `P`\>, `"autoArchive"`\> & `object`

### Returns

[`TimeTravel`](../classes/TimeTravel.md)\<`S`, `F`, `true`, `P`\>

## Call Signature

> **createTimeTravel**\<`S`, `F`, `P`\>(`initialState`, `options`): [`TimeTravel`](../classes/TimeTravel.md)\<`S`, `F`, `false`, `P`\>

Defined in: [packages/mutative/src/time-travel.ts:1059](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L1059)

Create a TimeTravel instance with manual archive mode

### Type Parameters

#### S

Type parameter **S**

#### F

`F` *extends* `boolean` = `false`

#### P

`P` *extends* `object` = `object`

### Parameters

#### initialState

Type parameter **S**

#### options

`Omit`\<[`TimeTravelOptions`](../type-aliases/TimeTravelOptions.md)\<`F`, `false`, `P`\>, `"autoArchive"`\> & `object`

### Returns

[`TimeTravel`](../classes/TimeTravel.md)\<`S`, `F`, `false`, `P`\>
