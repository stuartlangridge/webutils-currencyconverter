
var ccApp = angular.module('ccApp', []);

ccApp.controller('CCCtrl', function ($scope, $http) {

    var BASERATES_ESTABLISHED = 1407196460000; // Monday 4th August 2014

    function getRate(r1abbr, r2abbr) {
        console.log("in getRate getting rate for", r1abbr, r2abbr);
        var right = $scope.rates[[r1abbr, r2abbr].join("")],
            flipped = $scope.rates[[r2abbr, r1abbr].join("")];
        if (right !== undefined) return right;
        if (flipped !== undefined) return {rate:1/flipped.rate, updated:flipped.updated,pending:flipped.pending};
        return null;
    }

    function setRate(key, rate, opts) {
        if (!opts) opts = {};
        $scope.rates[key] = {
            rate: rate, 
            pending: !!opts.pending, 
            updated: opts.updated || (new Date().getTime())
        };
        console.log("set rate of", key, "to", rate, "with updated", $scope.rates[key].updated);
        if (!!!opts.pending) localStorage.setItem("cc-rates", JSON.stringify($scope.rates));
    }

    $scope.convert = function(curr) {
        var rate = getRate($scope.convcurr.abbr, curr.abbr),
            updateField = null, outRate, outUpdated;
        if (rate === null) {
            // we have no rate. Use the emergency rate, which involves converting via USD, and trigger update
            var convToUSD = getRate($scope.convcurr.abbr, "USD"),
                USDToCurr = getRate("USD", curr.abbr),
                emerKey = $scope.convcurr.abbr + curr.abbr,
                emerVal = convToUSD.rate * USDToCurr.rate;
            console.log("using emergency rate for", emerKey, "as value", emerVal, convToUSD, USDToCurr);
            setRate(emerKey, emerVal, {pending: true, updated: BASERATES_ESTABLISHED});
            updateField = emerKey;
            outRate = {rate:emerVal, pending: false, updated: BASERATES_ESTABLISHED};
            outUpdated = "updating...";
        } else if ((new Date().getTime()) - rate.updated > (1000 * 60 * 60 * 24)) {
            // we have a rate, but it's over a day old. Use it, and trigger update
            updateField = $scope.convcurr.abbr + curr.abbr;
            outRate = rate;
            outUpdated = Math.floor(((new Date().getTime()) - rate.updated) / 1000 / 60) + "m ago, updating...";
        } else {
            // we have a rate and it's good. Use it, and do not set updateField so no trigger happens
            outRate = rate;
            var ou = Math.floor(((new Date().getTime()) - rate.updated) / 1000 / 60);
            outUpdated = (ou === 0) ? "just now" : ou + "m ago";
        }
        if (updateField !== null) {
            if (outRate.pending) {
                console.log("not triggering update for", updateField, "because one is already pending");
            } else {
                console.log("triggering update for", updateField);
                setRate(updateField, outRate.rate, {pending: true, updated: outRate.updated});
                var yql = "//query.yahooapis.com/v1/public/yql?q=select%20id%2CRate%20from%20yahoo." +
                    "finance.xchange%20where%20pair%20in%20('" + updateField + "')&format=json&env=store" +
                    "%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK";
                console.log("fetching YQL for", updateField);
                $http.jsonp(yql, {timeout: 5000})
                    .success(function(data, status, headers, config) {
                        if (data && data.query && data.query.results && data.query.results.rate && data.query.results.rate.Rate) {
                            var nrate = parseFloat(data.query.results.rate.Rate);
                            if (!isNaN(nrate)) {
                                console.log("success for", updateField, "with", data.query.results.rate.Rate);
                                setRate(updateField, nrate);
                            }
                        } else {
                            console.log("success request, fail answer for", updateField);
                            // failure; leave the rate as it is, and mark it as old so we'll get it next time
                            setRate(updateField, outRate.rate, {pending:false, updated: BASERATES_ESTABLISHED});
                        }
                    })
                    .error(function(data, status, headers, config) {
                        console.log("failure for", updateField, "with", data, status);
                        setRate(updateField, outRate.rate, {pending:false, updated: BASERATES_ESTABLISHED});
                    });
            }
        }
        console.log("returning", outRate.rate, $scope.convval, outRate.rate * ($scope.convval || 0));
        return {amount: (outRate.rate * ($scope.convval || 0)).toFixed(3), updated: outUpdated};
    };

    var savedChosen = localStorage.getItem("cc-chosen");
    if (savedChosen) {
        $scope.chosen_currencies = JSON.parse(savedChosen);
    } else {
        $scope.chosen_currencies = [
            {abbr: 'AUD'},
            {abbr: 'GBP'},
            {abbr: 'EUR'},
            {abbr: 'JPY'},
        ];
    }

    $scope.$watch('chosen_currencies', function() {
       localStorage.setItem("cc-chosen", JSON.stringify($scope.chosen_currencies));
       console.log("saved", localStorage.getItem("cc-chosen"));
   }, true);

    var baserates = {
        USDMUR: {rate: 30.9, updated: BASERATES_ESTABLISHED, pending: false},
        USDTWD: {rate: 30.02, updated: BASERATES_ESTABLISHED, pending: false},
        USDIDR: {rate: 11700.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDNGN: {rate: 160.9, updated: BASERATES_ESTABLISHED, pending: false},
        USDILS: {rate: 3.4247, updated: BASERATES_ESTABLISHED, pending: false},
        USDETB: {rate: 19.791, updated: BASERATES_ESTABLISHED, pending: false},
        USDKMF: {rate: 367.7852, updated: BASERATES_ESTABLISHED, pending: false},
        USDMDL: {rate: 13.85, updated: BASERATES_ESTABLISHED, pending: false},
        USDPGK: {rate: 2.4488, updated: BASERATES_ESTABLISHED, pending: false},
        USDKYD: {rate: 0.82, updated: BASERATES_ESTABLISHED, pending: false},
        USDKHR: {rate: 4050.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDJMD: {rate: 112.44, updated: BASERATES_ESTABLISHED, pending: false},
        USDSAR: {rate: 3.7507, updated: BASERATES_ESTABLISHED, pending: false},
        USDAUD: {rate: 1.0746, updated: BASERATES_ESTABLISHED, pending: false},
        USDGIP: {rate: 0.5925, updated: BASERATES_ESTABLISHED, pending: false},
        USDCHF: {rate: 0.9092, updated: BASERATES_ESTABLISHED, pending: false},
        USDMVR: {rate: 15.39, updated: BASERATES_ESTABLISHED, pending: false},
        USDSVC: {rate: 8.747, updated: BASERATES_ESTABLISHED, pending: false},
        USDXCD: {rate: 2.7, updated: BASERATES_ESTABLISHED, pending: false},
        USDBDT: {rate: 77.61, updated: BASERATES_ESTABLISHED, pending: false},
        USDXOF: {rate: 490.6, updated: BASERATES_ESTABLISHED, pending: false},
        USDEUR: {rate: 0.7477, updated: BASERATES_ESTABLISHED, pending: false},
        USDTOP: {rate: 1.8648, updated: BASERATES_ESTABLISHED, pending: false},
        USDLVL: {rate: 0.5253, updated: BASERATES_ESTABLISHED, pending: false},
        USDNOK: {rate: 6.2829, updated: BASERATES_ESTABLISHED, pending: false},
        USDRWF: {rate: 691.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDALL: {rate: 104.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDMMK: {rate: 976.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDSYP: {rate: 149.2, updated: BASERATES_ESTABLISHED, pending: false},
        USDBTN: {rate: 60.81, updated: BASERATES_ESTABLISHED, pending: false},
        USDISK: {rate: 115.05, updated: BASERATES_ESTABLISHED, pending: false},
        USDDZD: {rate: 79.92, updated: BASERATES_ESTABLISHED, pending: false},
        USDMKD: {rate: 45.98, updated: BASERATES_ESTABLISHED, pending: false},
        USDFJD: {rate: 1.8505, updated: BASERATES_ESTABLISHED, pending: false},
        USDGBP: {rate: 0.5923, updated: BASERATES_ESTABLISHED, pending: false},
        USDCRC: {rate: 548.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDVUV: {rate: 94.05, updated: BASERATES_ESTABLISHED, pending: false},
        USDBZD: {rate: 1.995, updated: BASERATES_ESTABLISHED, pending: false},
        USDPAB: {rate: 1.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDDKK: {rate: 5.5739, updated: BASERATES_ESTABLISHED, pending: false},
        USDIQD: {rate: 1165.2, updated: BASERATES_ESTABLISHED, pending: false},
        USDERN: {rate: 15.1, updated: BASERATES_ESTABLISHED, pending: false},
        USDSZL: {rate: 10.723, updated: BASERATES_ESTABLISHED, pending: false},
        USDLBP: {rate: 1512.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDTZS: {rate: 1658.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDUYU: {rate: 23.35, updated: BASERATES_ESTABLISHED, pending: false},
        USDXPF: {rate: 89.1, updated: BASERATES_ESTABLISHED, pending: false},
        USDLYD: {rate: 1.2345, updated: BASERATES_ESTABLISHED, pending: false},
        USDSCR: {rate: 12.315, updated: BASERATES_ESTABLISHED, pending: false},
        USDHKD: {rate: 7.7501, updated: BASERATES_ESTABLISHED, pending: false},
        USDBSD: {rate: 1.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDKPW: {rate: 900.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDZMK: {rate: 5189.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDSHP: {rate: 0.5925, updated: BASERATES_ESTABLISHED, pending: false},
        USDXAU: {rate: 0.0008, updated: BASERATES_ESTABLISHED, pending: false},
        USDXPD: {rate: 0.0012, updated: BASERATES_ESTABLISHED, pending: false},
        USDBBD: {rate: 2.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDIRR: {rate: 26378.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDDJF: {rate: 181.2, updated: BASERATES_ESTABLISHED, pending: false},
        USDBMD: {rate: 1.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDVEF: {rate: 6.2925, updated: BASERATES_ESTABLISHED, pending: false},
        USDTHB: {rate: 32.225, updated: BASERATES_ESTABLISHED, pending: false},
        USDXPT: {rate: 0.0007, updated: BASERATES_ESTABLISHED, pending: false},
        USDXAF: {rate: 490.3802, updated: BASERATES_ESTABLISHED, pending: false},
        USDLAK: {rate: 8042.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDARS: {rate: 8.2628, updated: BASERATES_ESTABLISHED, pending: false},
        USDRUB: {rate: 36.073, updated: BASERATES_ESTABLISHED, pending: false},
        USDHRK: {rate: 5.7149, updated: BASERATES_ESTABLISHED, pending: false},
        USDCZK: {rate: 20.7795, updated: BASERATES_ESTABLISHED, pending: false},
        USDBRL: {rate: 2.2852, updated: BASERATES_ESTABLISHED, pending: false},
        USDPYG: {rate: 4231.6748, updated: BASERATES_ESTABLISHED, pending: false},
        USDPHP: {rate: 43.66, updated: BASERATES_ESTABLISHED, pending: false},
        USDRON: {rate: 3.3168, updated: BASERATES_ESTABLISHED, pending: false},
        USDQAR: {rate: 3.6417, updated: BASERATES_ESTABLISHED, pending: false},
        USDCOP: {rate: 1891.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDEGP: {rate: 7.1502, updated: BASERATES_ESTABLISHED, pending: false},
        USDLKR: {rate: 130.215, updated: BASERATES_ESTABLISHED, pending: false},
        USDBND: {rate: 1.2478, updated: BASERATES_ESTABLISHED, pending: false},
        USDTND: {rate: 1.7155, updated: BASERATES_ESTABLISHED, pending: false},
        USDPKR: {rate: 98.85, updated: BASERATES_ESTABLISHED, pending: false},
        USDHUF: {rate: 236.085, updated: BASERATES_ESTABLISHED, pending: false},
        USDBIF: {rate: 1535.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDMYR: {rate: 3.1875, updated: BASERATES_ESTABLISHED, pending: false},
        USDLSL: {rate: 10.755, updated: BASERATES_ESTABLISHED, pending: false},
        USDUAH: {rate: 12.3025, updated: BASERATES_ESTABLISHED, pending: false},
        USDSEK: {rate: 6.8843, updated: BASERATES_ESTABLISHED, pending: false},
        USDTTD: {rate: 6.36, updated: BASERATES_ESTABLISHED, pending: false},
        USDAWG: {rate: 1.78, updated: BASERATES_ESTABLISHED, pending: false},
        USDCUP: {rate: 1.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDKRW: {rate: 1033.08, updated: BASERATES_ESTABLISHED, pending: false},
        USDGMD: {rate: 39.6, updated: BASERATES_ESTABLISHED, pending: false},
        USDNZD: {rate: 1.1811, updated: BASERATES_ESTABLISHED, pending: false},
        USDGTQ: {rate: 7.8015, updated: BASERATES_ESTABLISHED, pending: false},
        USDTRY: {rate: 2.1532, updated: BASERATES_ESTABLISHED, pending: false},
        USDMRO: {rate: 290.9, updated: BASERATES_ESTABLISHED, pending: false},
        USDCLP: {rate: 577.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDFKP: {rate: 0.5925, updated: BASERATES_ESTABLISHED, pending: false},
        USDLRD: {rate: 82.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDAED: {rate: 3.6731, updated: BASERATES_ESTABLISHED, pending: false},
        USDKZT: {rate: 182.02, updated: BASERATES_ESTABLISHED, pending: false},
        USDHTG: {rate: 45.3498, updated: BASERATES_ESTABLISHED, pending: false},
        USDBHD: {rate: 0.3771, updated: BASERATES_ESTABLISHED, pending: false},
        USDUSD: {rate: 1.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDMAD: {rate: 8.3523, updated: BASERATES_ESTABLISHED, pending: false},
        USDSBD: {rate: 7.2209, updated: BASERATES_ESTABLISHED, pending: false},
        USDOMR: {rate: 0.3851, updated: BASERATES_ESTABLISHED, pending: false},
        USDJPY: {rate: 102.61, updated: BASERATES_ESTABLISHED, pending: false},
        USDXCP: {rate: 0.3126, updated: BASERATES_ESTABLISHED, pending: false},
        USDXAG: {rate: 0.0505, updated: BASERATES_ESTABLISHED, pending: false},
        USDKES: {rate: 87.95, updated: BASERATES_ESTABLISHED, pending: false},
        USDYER: {rate: 214.905, updated: BASERATES_ESTABLISHED, pending: false},
        USDNAD: {rate: 10.714, updated: BASERATES_ESTABLISHED, pending: false},
        USDHNL: {rate: 20.9981, updated: BASERATES_ESTABLISHED, pending: false},
        USDBGN: {rate: 1.4665, updated: BASERATES_ESTABLISHED, pending: false},
        USDWST: {rate: 2.3232, updated: BASERATES_ESTABLISHED, pending: false},
        USDGNF: {rate: 7035.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDPEN: {rate: 2.811, updated: BASERATES_ESTABLISHED, pending: false},
        USDCAD: {rate: 1.0961, updated: BASERATES_ESTABLISHED, pending: false},
        USDMWK: {rate: 396.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDCVE: {rate: 81.33, updated: BASERATES_ESTABLISHED, pending: false},
        USDBOB: {rate: 6.91, updated: BASERATES_ESTABLISHED, pending: false},
        USDKWD: {rate: 0.2834, updated: BASERATES_ESTABLISHED, pending: false},
        USDBWP: {rate: 8.8574, updated: BASERATES_ESTABLISHED, pending: false},
        USDGYD: {rate: 205.7, updated: BASERATES_ESTABLISHED, pending: false},
        USDMNT: {rate: 1859.5, updated: BASERATES_ESTABLISHED, pending: false},
        USDJOD: {rate: 0.7078, updated: BASERATES_ESTABLISHED, pending: false},
        USDUGX: {rate: 2617.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDSOS: {rate: 892.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDSGD: {rate: 1.2475, updated: BASERATES_ESTABLISHED, pending: false},
        USDDOP: {rate: 43.6, updated: BASERATES_ESTABLISHED, pending: false},
        USDSTD: {rate: 18330.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDBYR: {rate: 10345.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDCNY: {rate: 6.171, updated: BASERATES_ESTABLISHED, pending: false},
        USDSLL: {rate: 4370.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDLTL: {rate: 2.5815, updated: BASERATES_ESTABLISHED, pending: false},
        USDNIO: {rate: 26.065, updated: BASERATES_ESTABLISHED, pending: false},
        USDVND: {rate: 21215.0, updated: BASERATES_ESTABLISHED, pending: false},
        USDANG: {rate: 1.79, updated: BASERATES_ESTABLISHED, pending: false},
        USDINR: {rate: 61.08, updated: BASERATES_ESTABLISHED, pending: false},
        USDMOP: {rate: 7.9826, updated: BASERATES_ESTABLISHED, pending: false},
        USDMXN: {rate: 13.2922, updated: BASERATES_ESTABLISHED, pending: false},
        USDSDG: {rate: 5.6825, updated: BASERATES_ESTABLISHED, pending: false},
        USDZAR: {rate: 10.7368, updated: BASERATES_ESTABLISHED, pending: false},
        USDNPR: {rate: 98.49, updated: BASERATES_ESTABLISHED, pending: false},
        USDPLN: {rate: 3.1318, updated: BASERATES_ESTABLISHED, pending: false}
    };


    var loaded = localStorage.getItem("cc-rates");
    if (loaded) {
        $scope.rates = JSON.parse(loaded);
    } else {
        $scope.rates = baserates;
        localStorage.setItem("cc-rates", JSON.stringify(baserates));
    }

    $scope.currencies = [
        {name: 'Albanian Lek', abbr: 'ALL'},
        {name: 'Algerian Dinar', abbr: 'DZD'},
        {name: 'Argentine Peso', abbr: 'ARS'},
        {name: 'Aruba Florin', abbr: 'AWG'},
        {name: 'Australian Dollar', abbr: 'AUD'},
        {name: 'Bahamian Dollar', abbr: 'BSD'},
        {name: 'Bahraini Dinar', abbr: 'BHD'},
        {name: 'Bangladesh Taka', abbr: 'BDT'},
        {name: 'Barbados Dollar', abbr: 'BBD'},
        {name: 'Belarus Ruble', abbr: 'BYR'},
        {name: 'Belize Dollar', abbr: 'BZD'},
        {name: 'Bermuda Dollar', abbr: 'BMD'},
        {name: 'Bhutan Ngultrum', abbr: 'BTN'},
        {name: 'Bolivian Boliviano', abbr: 'BOB'},
        {name: 'Botswana Pula', abbr: 'BWP'},
        {name: 'Brazilian Real', abbr: 'BRL'},
        {name: 'British Pound', abbr: 'GBP'},
        {name: 'Brunei Dollar', abbr: 'BND'},
        {name: 'Bulgarian Lev', abbr: 'BGN'},
        {name: 'Burundi Franc', abbr: 'BIF'},
        {name: 'Cambodia Riel', abbr: 'KHR'},
        {name: 'Canadian Dollar', abbr: 'CAD'},
        {name: 'Cape Verde Escudo', abbr: 'CVE'},
        {name: 'Cayman Islands Dollar', abbr: 'KYD'},
        {name: 'CFA Franc (BCEAO)', abbr: 'XOF'},
        {name: 'CFA Franc (BEAC)', abbr: 'XAF'},
        {name: 'Chilean Peso', abbr: 'CLP'},
        {name: 'Chinese Yuan', abbr: 'CNY'},
        {name: 'Colombian Peso', abbr: 'COP'},
        {name: 'Comoros Franc', abbr: 'KMF'},
        {name: 'Copper Pounds', abbr: 'XCP'},
        {name: 'Costa Rica Colon', abbr: 'CRC'},
        {name: 'Croatian Kuna', abbr: 'HRK'},
        {name: 'Cuban Peso', abbr: 'CUP'},
        {name: 'Czech Koruna', abbr: 'CZK'},
        {name: 'Danish Krone', abbr: 'DKK'},
        {name: 'Dijibouti Franc', abbr: 'DJF'},
        {name: 'Dominican Peso', abbr: 'DOP'},
        {name: 'East Caribbean Dollar', abbr: 'XCD'},
        {name: 'Egyptian Pound', abbr: 'EGP'},
        {name: 'El Salvador Colon', abbr: 'SVC'},
        {name: 'Eritrea Nakfa', abbr: 'ERN'},
        {name: 'Ethiopian Birr', abbr: 'ETB'},
        {name: 'Euro', abbr: 'EUR'},
        {name: 'Falkland Islands Pound', abbr: 'FKP'},
        {name: 'Fiji Dollar', abbr: 'FJD'},
        {name: 'Gambian Dalasi', abbr: 'GMD'},
        {name: 'Gibraltar Pound', abbr: 'GIP'},
        {name: 'Gold Ounces', abbr: 'XAU'},
        {name: 'Guatemala Quetzal', abbr: 'GTQ'},
        {name: 'Guinea Franc', abbr: 'GNF'},
        {name: 'Guyana Dollar', abbr: 'GYD'},
        {name: 'Haiti Gourde', abbr: 'HTG'},
        {name: 'Honduras Lempira', abbr: 'HNL'},
        {name: 'Hong Kong Dollar', abbr: 'HKD'},
        {name: 'Hungarian Forint', abbr: 'HUF'},
        {name: 'Iceland Krona', abbr: 'ISK'},
        {name: 'Indian Rupee', abbr: 'INR'},
        {name: 'Indonesian Rupiah', abbr: 'IDR'},
        {name: 'Iran Rial', abbr: 'IRR'},
        {name: 'Iraqi Dinar', abbr: 'IQD'},
        {name: 'Israeli Shekel', abbr: 'ILS'},
        {name: 'Jamaican Dollar', abbr: 'JMD'},
        {name: 'Japanese Yen', abbr: 'JPY'},
        {name: 'Jordanian Dinar', abbr: 'JOD'},
        {name: 'Kazakhstan Tenge', abbr: 'KZT'},
        {name: 'Kenyan Shilling', abbr: 'KES'},
        {name: 'Korean Won', abbr: 'KRW'},
        {name: 'Kuwaiti Dinar', abbr: 'KWD'},
        {name: 'Lao Kip', abbr: 'LAK'},
        {name: 'Latvian Lat', abbr: 'LVL'},
        {name: 'Lebanese Pound', abbr: 'LBP'},
        {name: 'Lesotho Loti', abbr: 'LSL'},
        {name: 'Liberian Dollar', abbr: 'LRD'},
        {name: 'Libyan Dinar', abbr: 'LYD'},
        {name: 'Lithuanian Lita', abbr: 'LTL'},
        {name: 'Macau Pataca', abbr: 'MOP'},
        {name: 'Macedonian Denar', abbr: 'MKD'},
        {name: 'Malawi Kwacha', abbr: 'MWK'},
        {name: 'Malaysian Ringgit', abbr: 'MYR'},
        {name: 'Maldives Rufiyaa', abbr: 'MVR'},
        {name: 'Mauritania Ougulya', abbr: 'MRO'},
        {name: 'Mauritius Rupee', abbr: 'MUR'},
        {name: 'Mexican Peso', abbr: 'MXN'},
        {name: 'Moldovan Leu', abbr: 'MDL'},
        {name: 'Mongolian Tugrik', abbr: 'MNT'},
        {name: 'Moroccan Dirham', abbr: 'MAD'},
        {name: 'Myanmar Kyat', abbr: 'MMK'},
        {name: 'Namibian Dollar', abbr: 'NAD'},
        {name: 'Nepalese Rupee', abbr: 'NPR'},
        {name: 'Neth Antilles Guilder', abbr: 'ANG'},
        {name: 'New Zealand Dollar', abbr: 'NZD'},
        {name: 'Nicaragua Cordoba', abbr: 'NIO'},
        {name: 'Nigerian Naira', abbr: 'NGN'},
        {name: 'North Korean Won', abbr: 'KPW'},
        {name: 'Norwegian Krone', abbr: 'NOK'},
        {name: 'Omani Rial', abbr: 'OMR'},
        {name: 'Pacific Franc', abbr: 'XPF'},
        {name: 'Pakistani Rupee', abbr: 'PKR'},
        {name: 'Palladium Ounces', abbr: 'XPD'},
        {name: 'Panama Balboa', abbr: 'PAB'},
        {name: 'Papua New Guinea Kina', abbr: 'PGK'},
        {name: 'Paraguayan Guarani', abbr: 'PYG'},
        {name: 'Peruvian Nuevo Sol', abbr: 'PEN'},
        {name: 'Philippine Peso', abbr: 'PHP'},
        {name: 'Platinum Ounces', abbr: 'XPT'},
        {name: 'Polish Zloty', abbr: 'PLN'},
        {name: 'Qatar Rial', abbr: 'QAR'},
        {name: 'Romanian New Leu', abbr: 'RON'},
        {name: 'Russian Rouble', abbr: 'RUB'},
        {name: 'Rwanda Franc', abbr: 'RWF'},
        {name: 'Samoa Tala', abbr: 'WST'},
        {name: 'Sao Tome Dobra', abbr: 'STD'},
        {name: 'Saudi Arabian Riyal', abbr: 'SAR'},
        {name: 'Seychelles Rupee', abbr: 'SCR'},
        {name: 'Sierra Leone Leone', abbr: 'SLL'},
        {name: 'Silver Ounces', abbr: 'XAG'},
        {name: 'Singapore Dollar', abbr: 'SGD'},
        {name: 'Solomon Islands Dollar', abbr: 'SBD'},
        {name: 'Somali Shilling', abbr: 'SOS'},
        {name: 'South African Rand', abbr: 'ZAR'},
        {name: 'Sri Lanka Rupee', abbr: 'LKR'},
        {name: 'St Helena Pound', abbr: 'SHP'},
        {name: 'Sudanese Pound', abbr: 'SDG'},
        {name: 'Swaziland Lilageni', abbr: 'SZL'},
        {name: 'Swedish Krona', abbr: 'SEK'},
        {name: 'Swiss Franc', abbr: 'CHF'},
        {name: 'Syrian Pound', abbr: 'SYP'},
        {name: 'Taiwan Dollar', abbr: 'TWD'},
        {name: 'Tanzanian Shilling', abbr: 'TZS'},
        {name: 'Thai Baht', abbr: 'THB'},
        {name: "Tonga Pa'ang", abbr: 'TOP'},
        {name: 'Trinidad & Tobago Dollar', abbr: 'TTD'},
        {name: 'Tunisian Dinar', abbr: 'TND'},
        {name: 'Turkish Lira', abbr: 'TRY'},
        {name: 'UAE Dirham', abbr: 'AED'},
        {name: 'Ugandan Shilling', abbr: 'UGX'},
        {name: 'Ukraine Hryvnia', abbr: 'UAH'},
        {name: 'United States Dollar', abbr: 'USD'},
        {name: 'Uruguayan New Peso', abbr: 'UYU'},
        {name: 'Vanuatu Vatu', abbr: 'VUV'},
        {name: 'Venezuelan Bolivar Fuerte', abbr: 'VEF'},
        {name: 'Vietnam [removed]', abbr: 'VND'},
        {name: 'Yemen Riyal', abbr: 'YER'},
        {name: 'Zambian Kwacha', abbr: 'ZMK'},
    ].sort(function(a,b) {
        if (a.abbr < b.abbr) return -1;
        if (a.abbr > b.abbr) return 1;
        return 0;
    });

    $scope.currenciesByAbbr = {};

    var savedFromCurrency = localStorage.getItem("cc-from-currency-abbr");
    if (!savedFromCurrency) {
        savedFromCurrency = "USD";
    }
    $scope.$watch('convcurr', function() {
       localStorage.setItem("cc-from-currency-abbr", $scope.convcurr.abbr);
       console.log("saved", localStorage.getItem("cc-from-currency-abbr"));
   }, true);


    for (var i=0; i<$scope.currencies.length; i++) { 
        $scope.currenciesByAbbr[$scope.currencies[i].abbr] = $scope.currencies[i].name;
        if ($scope.currencies[i].abbr == savedFromCurrency) {
            $scope.convcurr = $scope.currencies[i];
        }
    }

    var savedFromAmount = parseInt(localStorage.getItem("cc-from-amount"), 10);
    if (!savedFromAmount || isNaN(savedFromAmount)) {
        savedFromAmount = 100;
    }
    $scope.$watch('convval', function() {
       localStorage.setItem("cc-from-amount", $scope.convval);
       console.log("saved", localStorage.getItem("cc-from-amount"));
    }, true);


    $scope.convval = savedFromAmount;

});
