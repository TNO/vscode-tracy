(Screenshot of component - Optional)

---
(Short description)


### Relations to other components

- __Parent:__ ParentComponent
- __Children:__
	- Child1
	- Child2


### Props

| Name | Type | Description |
| ---- | ---- | ----------- |
| `prop1` | `type1` | short description |
| `prop2` | `type2` | short description |
| `prop3` | `type3` | short description |


### State

| Name | Type | Initial Value | Description |
| ---- | ---- | ------------- | ----------- |
| `stateObj1` | `type1` | `init value` | short description |
| `stateObj2` | `type1` | `init value` | short description |
| `stateObj3` | `type1` | `init value` | short description |


### Functions

#### Component lifecycle functions

- `constructor(...)`
	__Params:__ 
	- `props: Props`
	__Description:__  Is invoked the first time the `StructureDialog` is opened. It constructs an array containing [StructureEntries](..\Types\StructureEntry.md) from the `logSelectedRows` props and updates the state accordingly.
	__Returns:__ -

- `shouldComponentUpdate(...)`
	__Params:__
	- `nextProps: Readonly<Props>`
	- `nextState: Readonly<State>`
	- `nextContext: any`
	__Description:__ This function returns a `boolean` value that indicates whether or not rendering should be skipped. It returns `true` if ..., and ... otherwise.
	__Returns:__
	- `boolean`

- `render()`
	__Description:__
	__Returns:__
	- Div of type `JSX.Element` containing....
#### Functionality-related functions
- `exampleFunctionWithNoParams()`
	__Description:__ short description of what happens in the function.
	__Returns:__ -

- `exampleFunctionWithParams(...)`
	__Params:__
	- `name: type`
	__Description:__ short description of what happens in the function.
	__Returns:__ -
