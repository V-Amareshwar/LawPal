// Inspired by the provided command.ts file 
export const ChatCommandPrefix = ":";

// Define the commands we want to support
interface ChatCommands {
  clear?: () => void; // Command to clear all messages
  del?: () => void;   // Command to delete the last message
}

export function useChatCommand(commands: ChatCommands = {}) {
  // Extracts the command name from the user input
  function extract(userInput: string): keyof ChatCommands | null {
    if (!userInput.startsWith(ChatCommandPrefix)) return null;
    const commandName = userInput.slice(1) as keyof ChatCommands;
    return commandName in commands ? commandName : null;
  }

  // Tries to match and invoke a command
  function match(userInput: string) {
    const commandName = extract(userInput);
    const matched = !!commandName;

    return {
      matched,
      invoke: () => {
        if (matched && commandName && commands[commandName]) {
          commands[commandName]!();
        }
      },
    };
  }

  return { match };
}