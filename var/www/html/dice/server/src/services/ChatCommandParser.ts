export interface ParsedCommand {
    isCommand: boolean;
    command?: string;
    args?: string[];
    originalText: string;
    diceExpression?: string;
    error?: string;
}

export interface CommandHelp {
    command: string;
    aliases: string[];
    description: string;
    usage: string;
    examples: string[];
}

export class ChatCommandParser {
    private static readonly ROLL_COMMANDS = ['roll', 'r', 'dice', 'd'];
    private static readonly HELP_COMMANDS = ['help', 'h', '?'];

    /**
     * Parse a chat message to detect and extract commands
     * @param message - Raw chat message
     * @returns Parsed command information
     */
    public static parseMessage(message: string): ParsedCommand {
        const trimmed = message.trim();

        // Check if it's a command (starts with /)
        if (!trimmed.startsWith('/')) {
            return {
                isCommand: false,
                originalText: message
            };
        }

        // Remove the leading slash and split into parts
        const withoutSlash = trimmed.slice(1);
        const parts = withoutSlash.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Handle roll commands
        if (this.ROLL_COMMANDS.includes(command)) {
            return this.parseRollCommand(command, args, message);
        }

        // Handle help commands
        if (this.HELP_COMMANDS.includes(command)) {
            return this.parseHelpCommand(command, args, message);
        }

        // Unknown command
        return {
            isCommand: true,
            command,
            args,
            originalText: message,
            error: `Unknown command: /${command}. Type /help for available commands.`
        };
    }

    /**
     * Parse roll command and extract dice expression
     * @param command - The roll command used
     * @param args - Arguments after the command
     * @param originalText - Original message text
     * @returns Parsed roll command
     */
    private static parseRollCommand(command: string, args: string[], originalText: string): ParsedCommand {
        if (args.length === 0) {
            return {
                isCommand: true,
                command,
                args,
                originalText,
                error: 'Roll command requires a dice expression. Example: /roll 2d6'
            };
        }

        // Join all args to form the dice expression
        const diceExpression = args.join(' ');

        // Basic validation of dice expression
        const validationError = this.validateDiceExpression(diceExpression);
        if (validationError) {
            return {
                isCommand: true,
                command,
                args,
                originalText,
                diceExpression,
                error: validationError
            };
        }

        return {
            isCommand: true,
            command,
            args,
            originalText,
            diceExpression
        };
    }

    /**
     * Parse help command
     * @param command - The help command used
     * @param args - Arguments after the command
     * @param originalText - Original message text
     * @returns Parsed help command
     */
    private static parseHelpCommand(command: string, args: string[], originalText: string): ParsedCommand {
        return {
            isCommand: true,
            command,
            args,
            originalText
        };
    }

    /**
     * Validate dice expression format
     * @param expression - Dice expression to validate
     * @returns Error message if invalid, null if valid
     */
    private static validateDiceExpression(expression: string): string | null {
        // Remove spaces for validation
        const cleaned = expression.replace(/\s+/g, '');

        // Basic dice expression regex - supports XdY format
        const diceRegex = /^(\d+)?d(\d+)$/i;

        if (!diceRegex.test(cleaned)) {
            return `Invalid dice expression: "${expression}". Use format like "2d6", "d20", "1d100".`;
        }

        const match = cleaned.match(diceRegex);
        if (match) {
            const numDice = match[1] ? parseInt(match[1], 10) : 1;
            const dieType = parseInt(match[2], 10);

            if (numDice <= 0) {
                return 'Number of dice must be greater than 0.';
            }

            if (dieType <= 0) {
                return 'Die type must be greater than 0.';
            }

            if (numDice > 10000) {
                return 'Maximum 10,000 dice allowed per roll.';
            }

            if (dieType > 1000000) {
                return 'Maximum die type is 1,000,000 sides.';
            }
        }

        return null;
    }

    /**
     * Get help information for commands
     * @param specificCommand - Optional specific command to get help for
     * @returns Help information
     */
    public static getHelp(specificCommand?: string): CommandHelp[] {
        const allHelp: CommandHelp[] = [
            {
                command: 'roll',
                aliases: ['r', 'dice', 'd'],
                description: 'Roll dice with the specified expression',
                usage: '/roll <dice_expression>',
                examples: [
                    '/roll 2d6',
                    '/r d20',
                    '/dice 3d8',
                    '/d 1d100'
                ]
            },
            {
                command: 'help',
                aliases: ['h', '?'],
                description: 'Show help information for commands',
                usage: '/help [command]',
                examples: [
                    '/help',
                    '/help roll',
                    '/h',
                    '/? roll'
                ]
            }
        ];

        if (specificCommand) {
            const specific = allHelp.find(help =>
                help.command === specificCommand.toLowerCase() ||
                help.aliases.includes(specificCommand.toLowerCase())
            );
            return specific ? [specific] : [];
        }

        return allHelp;
    }

    /**
     * Format help information as a readable string
     * @param helpInfo - Help information to format
     * @returns Formatted help string
     */
    public static formatHelp(helpInfo: CommandHelp[]): string {
        if (helpInfo.length === 0) {
            return 'No help available for that command.';
        }

        if (helpInfo.length === 1) {
            const help = helpInfo[0];
            const aliases = help.aliases.length > 0 ? ` (aliases: ${help.aliases.map(a => `/${a}`).join(', ')})` : '';
            return `**/${help.command}**${aliases}\n${help.description}\n\n**Usage:** ${help.usage}\n\n**Examples:**\n${help.examples.map(ex => `• ${ex}`).join('\n')}`;
        }

        // Multiple commands
        let result = '**Available Commands:**\n\n';
        helpInfo.forEach(help => {
            const aliases = help.aliases.length > 0 ? ` (${help.aliases.map(a => `/${a}`).join(', ')})` : '';
            result += `**/${help.command}**${aliases} - ${help.description}\n`;
        });
        result += '\nType `/help <command>` for detailed usage information.';

        return result;
    }

    /**
     * Check if a message is a command
     * @param message - Message to check
     * @returns True if message is a command
     */
    public static isCommand(message: string): boolean {
        return message.trim().startsWith('/');
    }

    /**
     * Get list of all supported commands
     * @returns Array of command names
     */
    public static getSupportedCommands(): string[] {
        return [...this.ROLL_COMMANDS, ...this.HELP_COMMANDS];
    }
} 