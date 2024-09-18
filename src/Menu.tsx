import { Box, ListItemProps, useMenu } from "@chakra-ui/react";
import { createContext, useContext, useEffect, useId, useRef } from "react";

const MenuContext = createContext<ReturnType<typeof useMenu> | null>(null);

export const Menu = ({ children }: { children: React.ReactNode }) => {
  const state = useMenu();
  const containerRef = useRef<HTMLDivElement>(null!);
  // const id = useId();

  useEffect(() => {
    (
      containerRef.current?.querySelector("[data-menuitem]") as HTMLLIElement
    )?.focus();
  }, []);

  return (
    <MenuContext.Provider value={state}>
      <Box
        py="3"
        px="3"
        ref={containerRef}
        as="ul"
        role="menu"
        onKeyDown={(e) => {
          const menuItems = e.currentTarget.querySelectorAll(
            "[data-menuitem]"
          ) as NodeListOf<HTMLLIElement>;
          let nextIndex = 0;
          // If a menu item is focused, set the next index to the this item's index
          Array.from(menuItems).forEach((item, index) => {
            if (document.activeElement === item) {
              nextIndex = index;
            }
          });
          if (e.key === "ArrowDown") {
            e.preventDefault();
            nextIndex = (nextIndex + 1) % menuItems.length;
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            nextIndex = (nextIndex - 1 + menuItems.length) % menuItems.length;
          }
          menuItems[nextIndex]?.focus();
        }}
      >
        {children}
      </Box>
    </MenuContext.Provider>
  );
};

export const MenuItem = ({
  children,
  ...props
}: { children: React.ReactNode } & ListItemProps) => {
  // const menuState = useContext(MenuContext);
  return (
    <Box
      role="menuitem"
      as="li"
      width="full"
      justifyContent="flex-start"
      data-menuitem
      display="flex"
      alignItems="center"
      py="1.5"
      px="3"
      gap="3"
      borderRadius="20px"
      tabIndex={0}
      cursor="pointer"
      _hover={{
        bg: "gray.50",
      }}
      _focus={{
        bg: "grayHighlight",
        outline: "none",
      }}
      _active={{
        bg: "grayHighlightDark",
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
