import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, IconButton, MenuItem, TextField, Box, Typography, Drawer, Button } from "@mui/material";
import { Menu as MenuIcon, Search as SearchIcon } from "@mui/icons-material";

const NavBar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const navigate = useNavigate();

  const menuitem = [
    { title: "Home", link: '/home' },
    { title: "Create Event", link: '/home/createEvent' },
    { title: "My Event", link: '/home/myevent' },
    { title: "Live Event", link: '/home/liveEvent' },
    { title: "History", link: '/home/history' },
    { title: "Logout", link: '/home/logout' }
  ];

  const handleMenuClick = (event) => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleMenuItemClick = (link) => {
    navigate(link);
    handleSidebarClose();
  };

  const handleSearchIconClick = () => {
    setSearchVisible(true);
  };

  const handleSearchClose = () => {
    setSearchVisible(false);
  };

  return (
    <div className="w-full top-0 fixed z-[100] h-16 bg-gray-200">
      <AppBar position="sticky" className="bg-white shadow-md">
        <Toolbar className="flex justify-between items-center px-4">
          {/* Hamburger Menu */}
          <IconButton color="inherit" onClick={handleMenuClick}>
            <MenuIcon sx={{ color: 'black', fontSize: '30px' }} />
          </IconButton>

          {/* App Name on larger screens */}
          <h1 className="hidden lg:block text-2xl font-bold text-black">PROCOL</h1>

          {/* Search Bar for large screens */}
          {searchVisible ? (
            <TextField
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              className="hidden md:block w-1/4"
              placeholder="Search..."
              autoFocus
            />
          ) : (
            <div className="hidden md:flex items-center">
              <Typography variant="h6" className="text-black">
                MyApp
              </Typography>
            </div>
          )}

          {/* Search Icon for mobile view */}
          <div className="sm:hidden flex items-center">
            <IconButton color="inherit" onClick={handleSearchIconClick}>
              <SearchIcon />
            </IconButton>
          </div>

          {/* Sidebar Menu */}
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={handleSidebarClose}
            sx={{
              "& .MuiDrawer-paper": {
                width: 240,
                boxSizing: "border-box",
              },
            }}
          >
            {/* App Name inside Sidebar */}
            <Box className="text-center">
              <Typography variant="h6" className="text-black font-bold">
                PROCOL
              </Typography>
            </Box>

            {/* Menu Items */}
            <Box className="flex flex-col mt-4">
              {menuitem.map((item) => (
                <MenuItem key={item.link} onClick={() => handleMenuItemClick(item.link)}>
                  {item.title}
                </MenuItem>
              ))}
            </Box>

            {/* Search in Sidebar for Mobile */}
            {searchVisible && (
              <Box className="mt-4 mx-4">
                <TextField
                  value={searchQuery}
                  onChange={handleSearchChange}
                  variant="outlined"
                  size="small"
                  className="w-full"
                  placeholder="Search..."
                />
              </Box>
            )}
          </Drawer>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default NavBar;
