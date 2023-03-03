export default abstract class Rule {
    readonly column: string;
    readonly description: string;
    abstract readonly friendlyType: string;
    static friendlyType = 'ShouldBeOverridden'; // TypeScript does not support abstract static

    constructor(column: string, description: string) {
        this.column = column;
        this.description = description;
    }

    abstract setColumn(string): Rule;
    abstract setDescription(string): Rule;
    abstract renderEdit(onEdit: (newRule: Rule) => void, keyWidth: string, textFieldWidth: string): JSX.Element;
}