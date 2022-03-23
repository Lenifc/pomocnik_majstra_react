import React, { useEffect, useState } from 'react';
import { Divider } from 'primereact/divider';
import { InputSwitch } from 'primereact/inputswitch';

import { Link } from 'react-router-dom'

import { ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';

function SidebarMenu( {Logout, isMenuCollapsed}){

    const [collapsed, setCollapsed] = useState(localStorage.getItem('menuStatus') ? JSON.parse(localStorage.getItem('menuStatus')) : false)

    useEffect(() =>{
      localStorage.setItem('menuStatus',collapsed)
      isMenuCollapsed(collapsed)
    }, [collapsed])

    return(<>
    <ProSidebar
        collapsed={collapsed}
        width={250}
        // breakPoint="sm"
        onToggle={() => setCollapsed(!collapsed)}
      >
        <Menu iconShape="square">
        <InputSwitch 
          checked={!collapsed} 
          onChange={(e) => setCollapsed(!e.value)} 
          tooltip={collapsed ? "Expand menu" : "Collapse menu"}
          className="menuSlider"
        />
            <div className={`menuTitle ${collapsed ? 'hidden' : ''}`}>General</div>
            <MenuItem icon={<i className="fas fa-desktop" />} >
              Dashboard<Link to="/dashboard" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-user" />}>
              Clients Manager<Link to="/clients" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-car" />}>
              Vehicles Manager<Link to="/vehicles" />
            </MenuItem>
            <Divider />
            <div className={` menuTitle ${collapsed ? 'hidden' : ''}`}>Tasks</div>
            <MenuItem icon={<i className="fas fa-plus" />}>
              Create new task<Link to="/tasks/create-new" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-parking" />}>
              New<Link to="/tasks/new" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-tasks" />}>
              in Progress<Link to="/tasks/inprogress" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-check" />}>
              Closed<Link to="/tasks/closed" />
            </MenuItem>
            <Divider />
            <MenuItem icon={<i className="fas fa-search" />}>
              Search for  client/car<Link to="/search" />
            </MenuItem>
            <Divider />
            <div className={`menuTitle ${collapsed ? 'hidden' : ''}`}>Settings</div>
            <MenuItem className="menuItem-disabled" icon={<i className="fas fa-tools" />}>Categories and prices</MenuItem>
            <MenuItem icon={<i className="fas fa-file-invoice-dollar" />}>Workshop details <Link to="/workshop/details" /></MenuItem>
            <MenuItem icon={<i className="fas fa-cogs" />}>Settings and Support<Link to="/settings" /></MenuItem>
            <Divider />
            <MenuItem icon={<i className="fas fa-power-off" />} onClick={() => Logout()}>Sign out</MenuItem>
        </Menu>
      </ProSidebar>          
    </>)
}

export default SidebarMenu