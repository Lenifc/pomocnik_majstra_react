import React, { useState } from 'react';
import { Divider } from 'primereact/divider';
import { InputSwitch } from 'primereact/inputswitch';

import { Link } from 'react-router-dom'

import { ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';

function SidebarMenu( {Logout}){

    const [collapsed, setCollapsed] = useState(false)

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
          tooltip={collapsed ? "Rozwiń menu" : "Zwiń menu"}
          className="MenuSlider"
        />
            <div className={`MenuTitle ${collapsed ? 'hidden' : ''}`}>WARSZTAT</div>
            <MenuItem icon={<i className="fas fa-desktop" />} >
              Dashboard<Link to="/dashboard" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-user" />}>
              Zarządzaj klientami<Link to="/clients" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-car" />}>
              Zarządzaj pojazdami<Link to="/vehicles" />
            </MenuItem>
            <Divider />
            <div className={` MenuTitle ${collapsed ? 'hidden' : ''}`}>ZLECENIA</div>
            <MenuItem icon={<i className="fas fa-plus" />}>
              Dodaj nowe zlecenie<Link to="/tasks/create-new" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-parking" />}>
              Oczekujące<Link to="/tasks/new" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-tasks" />}>
              W trakcie realizacji<Link to="/tasks/inprogress" />
            </MenuItem>
            <MenuItem icon={<i className="fas fa-check" />}>
              Zakończone<Link to="/tasks/closed" />
            </MenuItem>
            <Divider />
            <MenuItem icon={<i className="fas fa-search" />}>
              Szukaj pojazd/klienta<Link to="/search" />
            </MenuItem>
            <Divider />
            <div className={`MenuTitle ${collapsed ? 'hidden' : ''}`}>USTAWIENIA</div>
            <MenuItem icon={<i className="fas fa-tools MenuItem-disabled" />}>Kategorie i ceny</MenuItem>
            <MenuItem icon={<i className="fas fa-file-invoice-dollar" />}>Dane warsztatu</MenuItem>
            <MenuItem icon={<i className="fas fa-cogs" />}>Ustawienia i pomoc</MenuItem>
            <Divider />
            <MenuItem icon={<i className="fas fa-power-off" />} onClick={() => Logout()}>Wyloguj</MenuItem>
        </Menu>
      </ProSidebar>          
    </>)
}

export default SidebarMenu