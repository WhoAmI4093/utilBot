import c from 'ansi-colors'
export function color(rarity: number) {
    switch (rarity) {
        case 5:
            return c.yellow
        case 4:
            return c.red
        case 3:
            return c.magenta
        case 2:
            return c.blue
        case 1:
            return c.green
        default:
            return (s: string) => s
    }
}