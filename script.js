// const formAltStress = document.querySelector('[#]')
// const formMeanStress = document.querySelector('[#]')
// const formRRatio = document.querySelector('[#]')
// const formMaxStress = document.querySelector('[#]')
// const formPeakIn = document.querySelector('[#]')
// const formPeakOut = document.querySelector('[#]')
// const formKt = document.querySelector('[#]')
// const formHalfPkPk = document.querySelector('[#]')

// need form validation to ensure that if a number is not entered in the form it always returns nothing
// also need something to ensure user can only populate form fields two at a time  

// The purpose of this is to convert between different ways of describing a waveform.
// The problem: you can describe any waveform (in the context I care about at least) using various pairs of four basic parameters - 
// alt (waveform amplitude), mean (DC offset), max (the maximum point on the wave) and R ratio (max/min). Additionally the maths 
// to do this only works if the parameters are represented in a certian (consistent way) i.e. amplitude is the height between mean 
// and max not min and max.
//
// The Solution: the user inputs any two parameters and some flags that describe what state the data they just passed is in 
// and how they want the answers back. There is a block of 6 if statements that can work out which two parameters have been passed 
// and how to work out the other two remaining parameters. So the first thing I needed to do was put the data in the correct format
// to do some maths on. To hide all of this from the user I've stuck it in a class. All add notes about what each bit is trying to.


class FatigueStrength {
    constructor(altStress = null, meanStress = null, rRatio = null, maxStress = null, _peakIn = false, _peakOut = false, _kt = 1, _halfPkPk = true) {
        // I want the constructor to simply add these first couple as properties
        // I started using _ to differentiate between the property and the passed value but then had to swap it around 
        this.peakIn = _peakIn;
        this.peakOut = _peakOut;
        this.kt = _kt;
        this.halfPkPk = _halfPkPk;
        
        // console.log(`initial values passed: alt: ${altStress}, mean: ${meanStress}, r: ${rRatio}, max ${maxStress}.`)
        
        // this ensures that regardless of how it is inputted half-waveform amplitude is what is stored
        if (_halfPkPk = false && altStress !== null) {
            altStress /= 2;
        }

        // this ensures that regardless of whether notched data is passed it is stored as net-section, don't want it to
        // do division if null is passed as it will create a 0 which will throw out logic block later as 0 can be real value.
        if (_peakIn = true) {
            if (altStress !== null) {
                altStress /= _kt;
            }
            if (meanStress !== null) {
                meanStress /= _kt;
            }
            if (maxStress !== null) {
                maxStress /= _kt;
            }
        }

        // console.log(`0-pk / net section values: alt: ${altStress}, mean: ${meanStress}, r: ${rRatio}, max ${maxStress}.`)

        
        // six logic functions to work out how to calculate remaining 2 properties from the two already entered
        // switched to _naming inside class to signify we only want to see these via getters

        // each if statement checks that a particualr pair of parameters contain actual numbers
        // depending on which two are provided the maths is different on how to get the other two
        // there are 6 maths functions that are re-used in various sequences rather than write bespoke code for each,

        if (Number.isFinite(altStress) && Number.isFinite(meanStress)) {
            
            this._altStress = altStress;
            this._meanStress = meanStress;
            this._rRatio = (this._meanStress - this._altStress) / (this._meanStress + this._altStress);
            this._maxStress = this._meanStress + this._altStress;
            console.log(`result: .alt: ${this._altStress}, .mean: ${this._meanStress}, R: ${this._rRatio}, max: ${this._maxStress}.`);

        } else if (Number.isFinite(rRatio) && Number.isFinite(maxStress)) {
            
            this._rRatio = rRatio;
            this._maxStress = maxStress;
            this._altStress = this.AltFrormMaxR(this._maxStress, this._rRatio);
            this._meanStress = this.MeanFromMaxAlt(this._maxStress, this._altStress);
            console.log(`result: alt: ${this._altStress}, mean: ${this._meanStress}, .R: ${this._rRatio}, .max: ${this._maxStress}.`);

        } else if (Number.isFinite(altStress) && Number.isFinite(maxStress)) {
            
            this._altStress = altStress;
            this._maxStress = maxStress;
            this._rRatio = this.RFromAltMax(this._altStress, this._maxStress);
            this._meanStress = this.MeanFromMaxR(this._maxStress, this._rRatio);
            console.log(`result: .alt: ${this._altStress}, mean: ${this._meanStress}, R: ${this._rRatio}, .max ${this._maxStress}.`);

        } else if (Number.isFinite(altStress) && Number.isFinite(rRatio)) {
            
            this._altStress = altStress;
            this._rRatio = rRatio;
            this._maxStress = this.MaxFromAltR(this._altStress, this._rRatio);
            this._meanStress = this.MeanFromMaxR(this._maxStress, this._rRatio);
            console.log(`result: .alt: ${this._altStress}, mean: ${this._meanStress}, .R: ${this._rRatio}, max ${this._maxStress}.`);

        } else if (Number.isFinite(meanStress) && Number.isFinite(maxStress)) {
            
            this._meanStress = meanStress;
            this._maxStress = maxStress;
            this._altStress = this.AltFromMaxMean(this._maxStress, this._meanStress);
            this._rRatio = this.RFromMeanAlt(this._meanStress, this._altStress);
            console.log(`result: alt: ${this._altStress}, .mean: ${this._meanStress}, R: ${this._rRatio}, .max ${this._maxStress}.`);

        } else if (Number.isFinite(meanStress) && Number.isFinite(rRatio)) {
            
            this._meanStress = meanStress;
            this._rRatio = rRatio;
            // this cant be done without solving by iteration and I don't think I want to get into that.
            console.log(`result: alt: Not possible, .mean: ${this._meanStress}, .R: ${this._rRatio}, max: Not possible.`);

        } else {
            // if it doesn't work just stick all the values passed into the properties and we'll think of something later
            this._altStress = altStress;
            this._meanStress = meanStress;
            this._rRatio = rRatio;
            this._maxStress = maxStress;
            console.log(`no pairing found, values passed to logic block: alt: ${altStress}, mean: ${meanStress}, r: ${rRatio}, max ${maxStress}.`);
        
        }
        
    }

    // maths functions that the above re-uses in different combinations
    RFromMeanAlt (mean, alt) {
        return (mean - alt)/(mean + alt);
    }
    MeanFromMaxR (max, r) {
        return max * (1 + r) / 2;
    }
    AltFrormMaxR (max, r) {
        return max * (1 - r) / 2;
    }
    RFromAltMax (alt, max) {
        return 1 - ((2 * alt) / max);
    }
    MaxFromAltR (alt, r) {
        return (2 * alt) / (1 - r);
    }
    AltFromMaxMean (max, mean) {
        return max - mean;
    }
    MeanFromMaxAlt (max, alt) {
        return max - alt;
    }
    MaxFromAltMean (alt, mean) {
        return alt + mean;
    }


    // getters
    // at this stage I just want these to return the data to the format it was passed in in but later will look at implementing 
    // returning what format the user actually wants.
    get altStress () {
        if (this.peakIn = true) {
            return this._altStress *= this.kt;
        } else {
            return this._altStress;
        }
    }
    
    get meanStress () {
        if (this.peakIn = true) {
            return this._meanStress *= this.kt;
        } else {
            return this._meanStress;
        }
    }
    
    get maxStress () {
        if (this.peakIn = true) {
            return this._maxStress *= this.kt;
        } else {
            return this._maxStress;
        }
    }

    // R ratio isn't modified so it can go straight in a property without a getter.


}

let F1 = new FatigueStrength(250, 0, null, null); // should return R = -1 and max = 250
console.log(F1)
let F2 = new FatigueStrength(null, 200, 0.1, null); // should not be possible
console.log(F2)
let F3 = new FatigueStrength(null, null, 0.1, 300); // should be alt = 135 and mean = 165
console.log(F3)
let F4 = new FatigueStrength(250, null, null, 300); // should be a negative R and mean = 50
console.log(F4)
let F5 = new FatigueStrength(100, null, 0.1, null); 
console.log(F5)
let F6 = new FatigueStrength(null, 150, null, 300); // should be alt = 150 and R = 0
console.log(F6)