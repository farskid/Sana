import React, { useState, useRef } from "react";
import "./App.css";
import { Box, Button, Image, Input, Portal, Text } from "@chakra-ui/react";
import { assign, setup } from "xstate";
import { useMachine } from "@xstate/react";
interface App {
  name: string;
  count: number;
  icon: string;
}

interface Person {
  name: string;
  email: string;
  avatar: string;
}

const apps: App[] = [
  { name: "All", count: 24, icon: "📊" },
  { name: "Google Drive", count: 2, icon: "📁" },
  { name: "Azure", count: 2, icon: "☁️" },
  { name: "Slack", count: 6, icon: "💬" },
  { name: "Confluence", count: 2, icon: "📝" },
  { name: "Notion", count: 1, icon: "📓" },
  { name: "Github", count: 7, icon: "🐙" },
  { name: "Dropbox", count: 4, icon: "📦" },
  { name: "Sharepoint", count: 0, icon: "🔗" },
];

const people: Person[] = [
  {
    name: "Margie Ernser",
    email: "margie@acme.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Richard Tillman",
    email: "richard@acme.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Velma McCullough",
    email: "velma.mccullough@acme.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Pat Bahringer",
    email: "pat.bahringer@acme.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Delia Kling",
    email: "delia.kling@acme.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Rene Abshire",
    email: "rene.abshire@acme.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
];

const toNumericDuration = (ms: string) => +ms.replace("ms", "");

const animationAndChildSwapMachine = setup({
  types: {
    context: {} as {
      key: string | null;
      nextKey: string | null;
    },
    events: {} as
      | { type: "open dropdown"; key: string }
      | { type: "close dropdown" },
  },
  actions: {
    setKey: assign(({ event }) => {
      if (event.type === "open dropdown") {
        return {
          key: event.key,
        };
      }
      return {};
    }),
    clearKey: assign({
      key: null,
      nextKey: null,
    }),
    setNextKey: assign(({ event }) => {
      if (event.type === "open dropdown") {
        return {
          nextKey: event.key,
        };
      }
      return {};
    }),
    addAnimationClassName: () => {},
    clearAnimationClassName: () => {},
    addFirstTimeAnimationClassName: () => {},
    clearFirstTimeAnimationClassName: () => {},
    changeKey: assign({
      key: ({ context }) => context.nextKey,
      nextKey: null,
    }),
  },
  delays: {
    animationDuration: 0,
    animationDurationHalf: 0,
    firstTimeAnimationDuration: 0,
  },
}).createMachine({
  id: "root",
  initial: "dropdown closed",
  context: {
    key: null,
    nextKey: null,
  },
  states: {
    "dropdown closed": {
      on: {
        "open dropdown": {
          target: "opening first time",
          actions: ["setKey"],
        },
      },
    },
    "opening first time": {
      entry: ["addFirstTimeAnimationClassName"],
      after: {
        firstTimeAnimationDuration: {
          target: "dropdown opened",
          actions: "clearFirstTimeAnimationClassName",
        },
      },
    },
    "dropdown opened": {
      initial: "idle",
      states: {
        idle: {
          on: {
            "close dropdown": {
              target: "#root.dropdown closed",
              actions: "clearKey",
            },
            "open dropdown": {
              target: "animating",
              actions: ["addAnimationClassName", "setNextKey"],
            },
          },
        },
        animating: {
          after: {
            animationDurationHalf: {
              actions: "changeKey",
            },
            animationDuration: {
              target: "idle",
              actions: "clearAnimationClassName",
            },
          },
        },
      },
    },
  },
});

function AppsDropdown() {
  return (
    <Box p="4">
      <Box as="h2" fontSize="lg" fontWeight="semibold" mb={4}>
        Apps
      </Box>
      <Box as="ul">
        {apps.map((app, index) => (
          <Box
            key={index}
            as="li"
            display="flex"
            justifyContent="space-between"
            py={2}
          >
            <span>
              {app.icon} {app.name}
            </span>
            <span className="text-gray-500">{app.count}</span>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function PeopleDropdown({ people }: { people: Person[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <Box p={4}>
      <Box as="h2" fontSize="lg" fontWeight="semibold" mb={4}>
        People
      </Box>
      <Input
        type="search"
        placeholder="Search for people or teams..."
        className="w-full p-2 mb-4 border rounded-md"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Box as="ul">
        {people.map((person, index) => (
          <Box
            as="li"
            key={index}
            className="flex items-center py-2"
            display="flex"
            flexDirection="row"
            alignItems="center"
          >
            <Image
              src={person.avatar}
              alt={person.name}
              width="32px"
              height="32px"
              borderRadius="full"
              marginRight="4px"
            />
            <Box>
              <Text>{person.name}</Text>
              <Text isTruncated>{person.email}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const DropdownUI: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<{
    key: "apps" | "people";
    triggerPosition: DOMRect;
  } | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null!);
  const dropdownContentRef = useRef<HTMLDivElement>(null!);

  const animationDuration = toNumericDuration(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--animation-duration"
    )
  );

  const [state, send] = useMachine(
    animationAndChildSwapMachine.provide({
      actions: {
        addAnimationClassName: () => {
          dropdownContainerRef.current.classList.add("animate-blur");
        },
        clearAnimationClassName: () => {
          dropdownContainerRef.current.classList.remove("animate-blur");
        },
        addFirstTimeAnimationClassName: () => {
          dropdownContainerRef.current.classList.add("animate-first-time");
        },
        clearFirstTimeAnimationClassName: () => {
          dropdownContainerRef.current.classList.remove("animate-first-time");
        },
      },
      delays: {
        animationDuration,
        animationDurationHalf: animationDuration / 3,
        firstTimeAnimationDuration: 200,
      },
    })
  );

  return (
    <Box display="flex" flexDirection="row" gap="20">
      <Button
        variant="outline"
        bg="gray.200"
        borderRadius="md"
        px="4"
        py="2"
        onClick={(e) => {
          setActiveDropdown({
            key: "apps",
            triggerPosition: e.currentTarget.getBoundingClientRect(),
          });
          send({ type: "open dropdown", key: "apps" });
        }}
      >
        📊 Apps
      </Button>
      <Button
        variant="outline"
        bg="gray.200"
        borderRadius="md"
        px="4"
        py="2"
        onClick={(e) => {
          setActiveDropdown({
            key: "people",
            triggerPosition: e.currentTarget.getBoundingClientRect(),
          });
          send({ type: "open dropdown", key: "people" });
        }}
      >
        👥 People
      </Button>
      <Portal>
        <Box
          ref={dropdownContainerRef}
          position="absolute"
          bg="white"
          rounded="md"
          shadow="lg"
          overflow="hidden"
          hidden={!state.context.key}
          style={{
            width: activeDropdown?.key === "apps" ? "300px" : "400px",
            height: activeDropdown?.key === "apps" ? "400px" : "500px",
            top: activeDropdown
              ? activeDropdown.triggerPosition.top +
                activeDropdown.triggerPosition.height
              : 0,
            left: activeDropdown ? activeDropdown.triggerPosition.left : 0,
            transitionDuration: "var(--animation-duration)",
          }}
        >
          <Box ref={dropdownContentRef} hidden={!state.context.key}>
            {state.context.key ? (
              state.context.key === "apps" ? (
                <AppsDropdown />
              ) : state.context.key === "people" ? (
                <PeopleDropdown people={people} />
              ) : null
            ) : null}
          </Box>
        </Box>
      </Portal>
    </Box>
  );
};

export default function Component() {
  return (
    <Box
      height="100vh"
      bg="gray.100"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="start"
      pt="20"
    >
      <DropdownUI />
    </Box>
  );
}
