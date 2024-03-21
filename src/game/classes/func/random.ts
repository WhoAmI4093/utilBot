import axios from 'axios'
import fs from 'fs'

let floats = fs.readFileSync("db/floats.txt", 'utf-8').split("\r\n")
let wholes = fs.readFileSync("db/whole.txt", 'utf-8').split("\r\n")
let info = require("../../../../db/info.json")


export async function getRandomFloat(min: number = 0, max: number = 1): Promise<number> {
    if (info.float > 30000) {
        console.log("REFILL FLOATS")
        try {
            const response = await axios.get(
                'https://www.random.org/decimal-fractions/?num=1&dec=16&col=1&format=plain&rnd=new'
            );
            const randomFloat = parseFloat(response.data);

            return randomFloat * (max - min) + min;
        } catch (error: any) {
            console.error('Error fetching random float:', error.message);
            throw error;
        }
    } else {
        let fl = Number(floats[info.float])
        info.float += 1
        fs.writeFileSync("db/info.json", JSON.stringify(info))
        return fl * (max - min) + min;
    }
}

export async function getRandomInt(min: number, max: number): Promise<number> {
    if (info.whole > 10000) {
        console.log("REFILL WHOLES")
        try {
            const response = await axios.get(
                `https://www.random.org/integers/?num=1&min=${min}&max=${max}&col=1&base=10&format=plain&rnd=new`
            );
            const randomInt = parseInt(response.data);
            return randomInt;
        } catch (error: any) {
            console.error('Error fetching random float:', error.message);
            throw error;
        }
    } else {
        let int = Math.floor(Number(wholes[info.whole]) * (max - min + 1)) + min;
        info.whole += 1
        fs.writeFileSync("db/info.json", JSON.stringify(info))
        return int
    }
}

const scale = (fromRange: [number, number], toRange: [number, number]) => {
    const d = (toRange[1] - toRange[0]) / (fromRange[1] - fromRange[0]);
    return (from: number) => (from - fromRange[0]) * d + toRange[0];
};

export async function getRandomTriangleDistribution(low: number, high: number, mode: number) {
    let u = await getRandomFloat()
    let c = low
    if (high - low != 0) c = (mode - low) / (high - low)

    if (u > c) {
        u = 1 - u
        c = 1 - c
        let t = high
        high = low
        low = t
    }
    return low + (high - low) * Math.pow((u * c), 0.5)
}
export async function getRandomTriangleDistributionMean(low: number, high: number, mean: number) {
    return await getRandomTriangleDistribution(low, high, 3 * mean - low - high)

}

export async function generateRandomNormalDisctribution(min: number, max: number, avg: number, samples: number = 3): Promise<number> {
    let minDiff = Math.min(avg - min, max - avg)
    if (avg - min < max - avg) {
        let sample: Array<number> = await Promise.all(Array.from({ length: samples }).fill(0).map(async i => {
            let float = await getRandomFloat(avg - minDiff, avg + minDiff)
            if (float > avg) {
                float = scale([avg, avg + minDiff], [avg, max])(float)
            }
            return float
        }))
        let mean = sample.reduce((prev, cur) => prev + cur, 0) / samples
        return Math.min(max, Math.max(min, mean))
    } else {
        let sample: Array<number> = await Promise.all(Array.from({ length: samples }).fill(0).map(async i => {
            let float = await getRandomFloat(avg - minDiff, avg + minDiff)
            if (float < avg) {
                //float = scale([avg - minDiff, avg], [min, avg])(float)
            }
            return float
        }))
        let mean = sample.reduce((prev, cur) => prev + cur, 0) / samples
        return Math.min(max, Math.max(min, mean))
    }
}

async function visualizeProbabilities(min: number, max: number, avg: number, numSamples: number) {
    const histogram = new Array(101).fill(0); // 101 discrete intervals from 0 to 1

    for (let i = 0; i < numSamples; i++) {
        let randomValue = await getRandomTriangleDistribution(min, max, avg)
        let index = Math.floor(randomValue * 100);
        histogram[index]++;
    }

    // Normalize frequencies to get probabilities
    //const probabilities = histogram.map(freq => freq / numSamples);
    const probabilities = histogram
    // Log the probabilities
    for (let i = 0; i < probabilities.length; i++) {
        console.log(`[${i / 100}, ${probabilities[i].toFixed(8)}],`);
    }
}
async function visualizeProbabilitiesTriangular(low: number, high: number, mode: number, numSamples: number) {
    const histogram = new Array(101).fill(0); // 101 discrete intervals from 0 to 1

    let sum = 0

    for (let i = 0; i < numSamples; i++) {
        let randomValue = await getRandomTriangleDistributionMean(low, high, mode);
        sum += randomValue
        let index = Math.floor(randomValue * 100);
        histogram[index]++;
    }

    // Normalize frequencies to get probabilities
    //const probabilities = histogram.map(freq => freq / numSamples);
    const probabilities = histogram
    // Log the probabilities
    for (let i = 0; i < probabilities.length; i++) {
        console.log(`[${i / 100}, ${probabilities[i].toFixed(8)}],`);
    }
    console.log(sum / numSamples)
}
