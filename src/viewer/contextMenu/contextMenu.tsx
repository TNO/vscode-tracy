import React from "react";
import { ContextMenuItem } from "../types";
import { getContextMenuItemStyle, getContextMenuStyle } from "../hooks/useStyleManager";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    parentDivId: string
    items: ContextMenuItem[],
    isRenderedAbove: boolean;

}

interface State {
    xPos: number,
    yPos: number,
    showMenu: boolean,
    selectedItemIndex: number | null;
}

export default class ContextMenu extends React.PureComponent<Props, State> {
parentDiv: HTMLElement | null;

constructor(props: Props) {
    super(props);
    console.log(this.props.parentDivId);
    this.parentDiv = document.getElementById(this.props.parentDivId);
    console.log(this.parentDiv);
    this.state = {xPos: 0, yPos: 0, showMenu: false, selectedItemIndex: null};
}

componentDidMount(): void {
    if(this.parentDiv){
        this.parentDiv.addEventListener("click", this.handleClick);
        this.parentDiv.addEventListener("contextmenu", this.handleContextMenu);
    }
}

componentWillUnmount(): void {
    if(this.parentDiv){
        this.parentDiv.removeEventListener("click", this.handleClick);
        this.parentDiv.removeEventListener("contextmenu", this.handleContextMenu);
    }
}

handleClick = () => {
    if(this.state.selectedItemIndex !== null){
        this.props.items[this.state.selectedItemIndex].callback();
    }

    if (this.state.showMenu) this.setState({ showMenu: false, selectedItemIndex: null });
}

handleContextMenu = (e) => {
    e.preventDefault();

    this.setState({
        xPos: e.pageX,
        yPos: e.pageY,
        showMenu: true,
    });
}

toggleSelectedOptionIndex(selectedOptionIndex: number){
    this.setState({ selectedItemIndex: selectedOptionIndex });
}

clearSelectedOptionIndex(){
    this.setState({ selectedItemIndex: null });
}

renderMenuOptions(){
    const result: any = [];

    for(let o=0; o < this.props.items.length; o++){
        const isSelected = o === this.state.selectedItemIndex;
        const contextMenuItemStyle = getContextMenuItemStyle(isSelected);

        result.push(
        <div style={contextMenuItemStyle} onMouseEnter={() => this.toggleSelectedOptionIndex(o)}>
            {this.props.items[o].text}
        </div>)
    }

    return result;
}

render() {
    const { isRenderedAbove, items} = this.props;
    const { showMenu, xPos, yPos } = this.state;
    const dialogHeight = items.length * 28;

    const contextMenuStyle = getContextMenuStyle(isRenderedAbove, dialogHeight, xPos, yPos);

    if (showMenu)
        return (
            <div style={contextMenuStyle} onMouseLeave={() => this.clearSelectedOptionIndex()}>
                <motion.div  
                className="dialog"
                style={{ left: xPos, top: yPos}}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}>
                    <div style={{margin: '4px'}}>
                    {this.renderMenuOptions()}
                    </div>
                </motion.div>
            </div>

        );
    else return null;
  }
}