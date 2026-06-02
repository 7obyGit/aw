import colors from "picocolors";

export async function completionAction(shell: string): Promise<void> {
    const bashScript = `
_aw_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    opts="init env list add remove run describe find exec record completion help version"

    case "\${prev}" in
        list)
            COMPREPLY=( $(compgen -W "scripts sources" -- \${cur}) )
            return 0
            ;;
        add|remove)
            COMPREPLY=( $(compgen -W "script source" -- \${cur}) )
            return 0
            ;;
    esac

    COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
    return 0
}
complete -F _aw_completion aw
`;

    const zshScript = `
#compdef aw

_aw() {
    local line
    _arguments -C \\
        "1: :((init\\:'Initialize a new .aw directory' \\
               env\\:'Show environment variables' \\
               list\\:'List scripts or sources' \\
               add\\:'Add a source or script' \\
               remove\\:'Remove a source or script' \\
               run\\:'Run a script' \\
               describe\\:'Show script details' \\
               find\\:'Search for scripts' \\
               exec\\:'Run arbitrary command' \\
               record\\:'Record a script' \\
               completion\\:'Generate shell completion' \\
               help\\:'Show help' \\
               version\\:'Show version'))" \\
        "*::arg:->args"

    case $line[1] in
        list)
            _arguments "1: :((scripts\\:'List all scripts' sources\\:'List all sources'))"
            ;;
        add|remove)
            _arguments "1: :((script\\:'Add/Remove a script' source\\:'Add/Remove a source'))"
            ;;
    esac
}

_aw "$@"
`;

    const fishScript = `
complete -c aw -n "__fish_use_subcommand" -a init -d 'Initialize a new .aw directory'
complete -c aw -n "__fish_use_subcommand" -a env -d 'Show environment variables'
complete -c aw -n "__fish_use_subcommand" -a list -d 'List scripts or sources'
complete -c aw -n "__fish_seen_subcommand_from list" -a scripts -d 'List all scripts'
complete -c aw -n "__fish_seen_subcommand_from list" -a sources -d 'List all sources'
complete -c aw -n "__fish_use_subcommand" -a add -d 'Add a source or script'
complete -c aw -n "__fish_seen_subcommand_from add" -a script -d 'Add a script'
complete -c aw -n "__fish_seen_subcommand_from add" -a source -d 'Add a source'
complete -c aw -n "__fish_use_subcommand" -a remove -d 'Remove a source or script'
complete -c aw -n "__fish_seen_subcommand_from remove" -a script -d 'Remove a script'
complete -c aw -n "__fish_seen_subcommand_from remove" -a source -d 'Remove a source'
complete -c aw -n "__fish_use_subcommand" -a run -d 'Run a script'
complete -c aw -n "__fish_use_subcommand" -a describe -d 'Show script details'
complete -c aw -n "__fish_use_subcommand" -a find -d 'Search for scripts'
complete -c aw -n "__fish_use_subcommand" -a exec -d 'Run arbitrary command'
complete -c aw -n "__fish_use_subcommand" -a record -d 'Record a script'
complete -c aw -n "__fish_use_subcommand" -a completion -d 'Generate shell completion'
`;

    switch (shell.toLowerCase()) {
        case "bash":
            process.stdout.write(bashScript.trim() + "\n");
            break;
        case "zsh":
            process.stdout.write(zshScript.trim() + "\n");
            break;
        case "fish":
            process.stdout.write(fishScript.trim() + "\n");
            break;
        default:
            process.stderr.write(
                colors.red(`Unknown shell: ${shell}. Supported: bash, zsh, fish\n`)
            );
            process.exit(1);
    }
}
