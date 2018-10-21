
class InterTechnoDecoder {
    public val2code(v) {
        let s = ""
        for (let b = 1; b < 16; b <<= 1) {
            s += (v & b) ? "f" : "0"
        }
        return s
    }

    public code2val(c) {
        let n = 0
        for (let i = 0; i < c.length; i++) {
            let a = c.charAt(i)
            if (a == "f")
                n += (1 << i)
            else if (a != "0")
                return -1;
        }
        return n
    }

    public sendCodeV1(params) {
        let code = params.code.toUpperCase()
        let houseCode = code.charCodeAt(0) - "A".charCodeAt(0)
        let deviceCode = parseInt(code.substring(1, 3), 10)

        let funcCode = code.substring(3, 4)
        switch (funcCode) {
            case "1":
                funcCode = "0fff"
                break
            case "G":
                funcCode = "ffff"
                break
            default:
                funcCode = "0ff0"
        }

        let seq = this.val2code(houseCode) + this.val2code(deviceCode - 1) + funcCode

        let p: number[] = [];
        for (let i = 0; i < seq.length; i++) {
            let c = seq[i]
            switch (c) {
                case "0":
                    p.push(1)
                    p.push(3)
                    p.push(1)
                    p.push(3)
                    break;
                case "1":
                    p.push(3)
                    p.push(1)
                    p.push(3)
                    p.push(1)
                    break;
                case "f":
                    p.push(1)
                    p.push(3)
                    p.push(3)
                    p.push(1)
                    break;
            }
        }

        p.push(1)

        let m = {
            freq: 433.92,
            repeat: 20,
            pause: 25,
            pulsewidth: 360,
            payload: p
        }


    }

    public sendCodeV3(params) {
        let code = params.code
        let houseCode = parseInt(code.substring(0, 7), 16)
        let deviceCode = parseInt(code.substring(7, 8), 16)
        let funcCode = parseInt(code.substring(8, 9), 16)

        let p: number[] = [];

        function out(val, len) {
            let b = 1 << (len - 1)
            while (b) {
                if (val & b) {
                    p.push(2)
                    p.push(9)
                    p.push(2)
                    p.push(2)
                } else {
                    p.push(2)
                    p.push(2)
                    p.push(2)
                    p.push(9)
                }

                b >>= 1
            }
        }

        p.push(2)
        p.push(20)
        out(houseCode, 26)
        out(funcCode, 2)
        out(deviceCode, 4)
        p.push(2)
        //p.push(1)
        //p[p.length-1]+=2

        let l = 0
        for (let i = 0; i < p.length; i++) {
            l += p[i]
        }




        let m = {
            freq: 433.92,
            repeat: 15,
            pause: 180,
            pulsewidth: 137,
            payload: p,
            len: l
        }

        return m

    }

    public decodeIntertechno(frame: number[]): string {
        let s = ""
        for (let i = 0; i < frame.length; i++) {
            let n = frame[i]
            if (n >= 2 && n <= 6)
                s += "1"
            else if (n >= 9 && n <= 13)
                s += "3"
            else
                s += "x"
        }

        let c = ""
        for (let i = 0; i < s.length; i += 4) {
            let a = s.substring(i, Math.min(s.length, i + 4))
            switch (a) {
                case "1313":
                    c += "0";
                    break;
                case "3131":
                    c += "1";
                    break;
                case "1331":
                    c += "f";
                    break;
                case "1":
                    c += "s";
                    break;
                default:
                    c += "x"
            }
        }

        if (c.length != 13 || c.substring(12) != "s") return c;

        let itc = ""
        //house code
        let h_code = this.code2val(c.substring(0, 4))
        if (h_code < 0) return c;
        itc += "ABCDEFGHIJKLMNOP".charAt(h_code);

        //device code
        let a = this.code2val(c.substring(4, 8))
        if (a < 0) return c;
        itc += "01020304050607080910111213141516".substring(a * 2, a * 2 + 2)

        //function code
        if (c.substring(8, 12) == "0ff0") {
            itc += "0"
        } else if (c.substring(8, 12) == "0fff") {
            itc += "1"
        } else if (c.substring(8, 12) == "ffff") {
            itc += "G"
        } else
            return c

        return "IT-" + itc
    }

    /*************************************/

    public decodeIntertechnoV3(frame): string {
        let s = ""
        for (let i = 0; i < frame.length; i++) {
            let n = frame[i]
            if (n >= 2 && n <= 5)
                s += "1"
            else if (n >= 11 && n <= 16)
                s += "5"
            else if (n >= 24 && n <= 30)
                s += "A"
            else
                s += "x"
        }

        if (s.substring(0, 2) != "1A") return "nosync"

        let c = ""
        for (let i = 2; i < s.length; i += 4) {
            let a = s.substring(i, Math.min(s.length, i + 4))
            switch (a) {
                case "1115":
                    c += "0";
                    break;
                case "1511":
                    c += "1";
                    break;
                case "1111":
                    c += "D";
                    break;
                case "1":
                    c += "s";
                    break;
                default:
                    c += "x"
            }
        }

        if (c.length != 33 || c.substring(32) != "s") return c;

        let itc = parseInt(c.substring(0, 26), 2).toString(16)
        itc = "0000000".substring(itc.length) + itc
        itc += parseInt(c.substring(28, 32), 2).toString(16)
        itc += c.substring(27, 28)

        return "IT3-" + itc
    }
};

export const sInterTechnoDecoder: InterTechnoDecoder = new InterTechnoDecoder();