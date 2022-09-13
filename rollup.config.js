import kontra from 'rollup-plugin-kontra'

export default {
    input: 'src/app/kontra.mjs', // The full kontra library
    output: {
        file: 'src/app/kontra.js', // The trimmed-down file used by the game
        format: "es",
        plugins: [
            kontra({
                gameObject: {
                    velocity: true,
                    anchor: true,
                    group: true,
                    scale: true
                },
                sprite: {
                    animation: true,
                    image: true
                }
            })
        ]
    }
}