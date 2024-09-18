import React, { useState } from "react";
import {
  Box,
  Divider,
  FormLabel,
  Image,
  Input,
  Switch,
  Text,
} from "@chakra-ui/react";
import {
  AzureIcon,
  CalendarIcon,
  CaretDownIcon,
  ConfluenceIcon,
  DropboxIcon,
  FolderIcon,
  GithubIcon,
  GoogleDriveIcon,
  MoreIcon,
  NotionIcon,
  PoepleIcon,
  SearchIcon,
  SharepointIcon,
  SlackIcon,
} from "./Icons";
import { Menu, MenuItem } from "./Menu";
import { FilterGroup } from "./FilterGroup";

interface App {
  name: string;
  count: number;
  icon: React.ReactNode;
}

interface Person {
  name: string;
  email: string;
  avatar: string;
}

interface ModifiedOption {
  label: string;
  value: string;
}

// Mock data
const apps: App[] = [
  { name: "All", count: 24, icon: null },
  { name: "Google Drive", count: 2, icon: <GoogleDriveIcon /> },
  { name: "Azure", count: 2, icon: <AzureIcon /> },
  { name: "Slack", count: 6, icon: <SlackIcon /> },
  { name: "Confluence", count: 2, icon: <ConfluenceIcon /> },
  { name: "Notion", count: 1, icon: <NotionIcon /> },
  { name: "Github", count: 7, icon: <GithubIcon /> },
  { name: "Dropbox", count: 4, icon: <DropboxIcon /> },
  { name: "Sharepoint", count: 0, icon: <SharepointIcon /> },
];

const people: Person[] = [
  {
    name: "Margie Ernser",
    email: "margie@acme.com",
    avatar: "/mock-avatars/margie.png",
  },
  {
    name: "Richard Tillman",
    email: "richard@acme.com",
    avatar: "/mock-avatars/richard.png",
  },
  {
    name: "Velma McCullough",
    email: "velma.mccullough@acme.com",
    avatar: "/mock-avatars/velma.png",
  },
  {
    name: "Pat Bahringer",
    email: "pat.bahringer@acme.com",
    avatar: "/mock-avatars/pat.png",
  },
  {
    name: "Delia Kling",
    email: "delia.kling@acme.com",
    avatar: "/mock-avatars/delia.png",
  },
  {
    name: "Rene Abshire",
    email: "rene.abshire@acme.com",
    avatar: "/mock-avatars/rene.png",
  },
];

const modifiedOptions: ModifiedOption[] = [
  { label: "Any time", value: "anyTime" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7Days" },
  { label: "Last 30 days", value: "last30Days" },
  { label: "This year", value: "thisYear" },
];

function AppsDropdownContent({ apps }: { apps: App[] }) {
  return (
    <Menu>
      {apps.map((app, index) => (
        <MenuItem key={index}>
          {app.icon}
          <Text fontWeight="500">{app.name}</Text>
          <Text color="secondaryText">{app.count}</Text>
        </MenuItem>
      ))}
    </Menu>
  );
}

function PeopleDropdownContent({ people }: { people: Person[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <Box py="2" px="3">
      <Box
        display="flex"
        alignItems="center"
        borderBottom="1px solid var(--chakra-colors-grayHighlight)"
        px="3"
      >
        <SearchIcon />
        <Input
          type="text"
          placeholder="Search for people or teams..."
          width="full"
          p="2"
          mb="4"
          border="none"
          borderRadius="0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          color="secondaryText"
          m="0"
          _focus={{
            outline: "none",
            boxShadow: "none",
          }}
        />
      </Box>
      <Box as="ul" px="3">
        {people.map((person, index) => (
          <Box
            as="li"
            key={index}
            display="flex"
            flexDirection="row"
            alignItems="center"
            py="2"
            gap="2"
          >
            <Image
              src={person.avatar}
              alt={person.name}
              width="16px"
              height="16px"
              borderRadius="4px"
              marginRight="4px"
            />
            <Text whiteSpace="nowrap" fontWeight="500">
              {person.name}
            </Text>
            <Text color="secondaryText" isTruncated>
              {person.email}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ModifiedDropdownContent({ options }: { options: ModifiedOption[] }) {
  return (
    <Menu>
      {options.map((option, index) => (
        <MenuItem key={index}>
          <Text>{option.label}</Text>
        </MenuItem>
      ))}
      <Divider marginBlock="2" />
      <MenuItem display="flex" justifyContent="space-between">
        <Text>Custom range</Text>
        <CaretDownIcon style={{ transform: "rotateZ(-90deg)" }} />
      </MenuItem>
    </Menu>
  );
}

export function App() {
  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      pt="20"
    >
      <FilterGroup
        group={{
          apps: {
            label: "Apps",
            icon: <FolderIcon />,
            dropdownContent: <AppsDropdownContent apps={apps} />,
          },
          people: {
            label: "People",
            icon: <PoepleIcon />,
            dropdownContent: <PeopleDropdownContent people={people} />,
          },
          modified: {
            label: "Modified",
            icon: <CalendarIcon />,
            dropdownContent: (
              <ModifiedDropdownContent options={modifiedOptions} />
            ),
          },
          more: {
            label: "More",
            icon: <MoreIcon />,
            dropdownContent: (
              <Box py="3" px="3" display="flex" flexDirection="column" gap="2">
                <FormLabel display="flex" justifyContent="space-between" m="0">
                  <Text>Show deleted results</Text>
                  <Switch colorScheme="gray" />
                </FormLabel>
              </Box>
            ),
            triggerProps: {
              marginLeft: "10",
            },
          },
        }}
      />
    </Box>
  );
}
