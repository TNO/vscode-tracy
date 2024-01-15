import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import SaveIcon from '@mui/icons-material/Save';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import SettingsIcon from '@mui/icons-material/Settings';

interface StructureSettingsDropdownProps {
  onStructureDefinitionSave: () => void;
  onStructureDefinitionLoad: () => void;
}

export const StructureSettingsDropdown: React.FunctionComponent<StructureSettingsDropdownProps> = ({onStructureDefinitionSave, onStructureDefinitionLoad}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (action: string) => {
    if (action === 'save')
      onStructureDefinitionSave();
    else if (action === 'load')
      onStructureDefinitionLoad();

    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        id="settings-button"
        size="small"
        aria-label='settings'
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <SettingsIcon fontSize="small"/>
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose('')}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {/* <MenuItem onClick={handleClose}>Profile</MenuItem> */}
        <MenuItem onClick={() => handleClose('save')}>
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save Structure Definition</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleClose('load')}>
          <ListItemIcon>
            <FileOpenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText color='white'>Load Structure Definition</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
}