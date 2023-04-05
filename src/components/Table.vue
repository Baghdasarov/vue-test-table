<script>
import data from "../api/data.json";

export default {
  name: "Table",
  data() {
    return {
      items: data.Items,
      currencies: [],
      currency: "USD",
      quoteType: "Spread",
      yearsByCurrencyType: {},
      expendedItems: {},
      isDataLoaded: false,
      search: "",
      yearsSelected: {},
      sortDesc: false,
      sortBy: ["DateSent", "Preferred"],
      averageData: {},
      smallestValues: {},
    };
  },
  created() {
    this.calculateAverageSpread();
    this.calculateSmallestValues();
  },
  watch: {
    currency() {
      this.calculateAverageSpread();
      this.calculateSmallestValues();
    },
    quoteType() {
      this.calculateAverageSpread();
      this.calculateSmallestValues();
    },
    yearsSelected() {
      this.calculateAverageSpread(this.yearsSelected[this.currency]);
      this.calculateSmallestValues();
    },
  },
  computed: {
    Headers() {
      const data = [
        {
          text: "Date Sent",
          value: "DateSent",
          groupable: false,
          align: 'center'
        },
        {
          text: "Company",
          value: "Company",
          groupable: false,
          filter: (f) => {
            return (f + "").toLowerCase().includes(this.search.toLowerCase());
          },
        },
      ];

      this.yearsSelected[this.currency].forEach(function (year) {
        data.push(
          {
            text: `${year} YRS Fix`,
            value: `quoteFilter${year}YearsFix`,
            sortable: false,
          },
          {
            text: `${year} YRS Frn`,
            value: `quoteFilter${year}YearsFrn`,
            sortable: false,
          }
        );
      });

      return data;
    },
  },
  methods: {
    generateQuoteData(data, year, currency, quoteType, couponType) {
      for (let i = 0; i < data.Quote?.length; i++) {
        let quote = data.Quote[i];
        if (
          quote.Years > year[0] &&
          quote.Years <= year[1] &&
          quote.Currency === currency &&
          quote.CouponType === couponType
        ) {
          if (quoteType === "Yield") {
            return this.formatYieldValue(quote[quoteType]);
          } else {
            return this.formatSpreadValue(quote[quoteType]);
          }
        }
      }
    },
    getQuoteData(data, year, currency, quoteType, couponType) {
      for (let i = 0; i < data.Quote?.length; i++) {
        let quote = data.Quote[i];
        if (
          quote.Years > year[0] &&
          quote.Years <= year[1] &&
          quote.Currency === currency &&
          quote.CouponType === couponType
        ) {
          if (quoteType === "Yield") {
            return quote[quoteType];
          } else {
            return quote[quoteType];
          }
        }
      }
    },
    toggleRow(id) {
      this.expendedItems = {
        ...this.expendedItems,
        [id]: !this.expendedItems[id],
      };
    },
    changeCurrency(newCurrency) {
      this.currency = newCurrency;
    },
    changeQuoteType(newQuoteType) {
      this.quoteType = newQuoteType;
    },
    changeYearArr(num) {
      const arr = this.yearsSelected[this.currency];
      const numIndex = arr.indexOf(num);

      if (numIndex === -1) {
        arr.push(num);
      } else if (arr.length !== 1) {
        arr.splice(numIndex, 1);
      }

      this.yearsSelected = {
        ...this.yearsSelected,
        [this.currency]: arr.sort((a, b) => a - b),
      };
    },
    formatDate(dateString) {
      if (dateString) {
        const date = new Date(dateString);

        const options = { day: "numeric", month: "short", year: "2-digit" };
        return date.toLocaleDateString("en-GB", options).replace(/ /g, "-");
      }
    },
    formatSpreadValue(value) {
      if (value) {
        return `+${value}bp`;
      }
    },
    formatYieldValue(value) {
      if (value) {
        return `${value}%`;
      }
    },
    calculateAverageSpread(yearsData = undefined) {
      const data = {};
      for (const item of this.items) {
        if (item.Quote) {
          for (const quote of item.Quote) {
            let currentQuote;
            if (this.quoteType === "Spread") {
              currentQuote = quote.Spread;
            } else if (this.quoteType === "Yield") {
              currentQuote = quote.Yield;
            } else if (this.quoteType === "3MLSpread") {
              currentQuote = quote["3MLSpread"];
            } else {
              throw new Error("Invalid quote type.");
            }
            if (!isNaN(currentQuote)) {
              let yearGroup;
              if (quote.Years >= 0 && quote.Years <= 5) {
                yearGroup = "5";
              } else if (quote.Years > 5 && quote.Years <= 10) {
                yearGroup = "10";
              } else if (quote.Years > 10 && quote.Years <= 40) {
                yearGroup = "40";
              }
              if (!data[yearGroup]) {
                data[yearGroup] = {};
              }
              if (!data[yearGroup][quote.CouponType]) {
                data[yearGroup][quote.CouponType] = { total: 0, count: 0 };
              }
              if (quote.Currency === this.currency) {
                data[yearGroup][quote.CouponType].total += currentQuote;
                data[yearGroup][quote.CouponType].count++;
              }
            }
          }
        }
      }
      const averageData = {};
      for (const yearGroup in data) {
        if (!yearsData || yearsData.includes(+yearGroup)) {
          for (const couponType in data[yearGroup]) {
            const { total, count } = data[yearGroup][couponType];
            if (!averageData[yearGroup]) {
              averageData[yearGroup] = {};
            }
            averageData[yearGroup][couponType] = (total / count).toFixed(2);
          }
        }
      }
      this.averageData = averageData;
    },
    calculateSmallestValues() {
      const smallestValues = {
        5: Infinity,
        10: Infinity,
        40: Infinity,
      };

      for (const item of data.Items) {
        if (!item.Quote || item.Quote.length === 0) {
          continue;
        }

        for (const quote of item.Quote) {
          if (quote.CouponType !== "FIX") {
            continue;
          }

          const years = quote.Years;
          const currency = quote.Currency;
          const quoteVal = quote[this.quoteType];

          if (years >= 0 && years <= 5 && currency === this.currency) {
            smallestValues["5"] = Math.min(smallestValues["5"], quoteVal);
          } else if (years > 5 && years <= 10 && currency === this.currency) {
            smallestValues["10"] = Math.min(smallestValues["10"], quoteVal);
          } else if (years > 10 && years <= 40 && currency === this.currency) {
            smallestValues["40"] = Math.min(smallestValues["40"], quoteVal);
          }
        }
      }

      console.log(smallestValues)

      this.smallestValues = smallestValues;
    },
  },
  beforeMount() {
    const currencies = [];
    this.items.forEach((item) =>
      item.Quote?.forEach((quote) => {
        currencies.push(quote.Currency);
      })
    );

    this.currencies = [...new Set(currencies)];
    this.currency = this.currencies[0];
    this.currencies.forEach((currency) => {
      this.yearsSelected[currency] = [5, 10, 40];
    });
  },
};
</script>

<template>
  <v-container class="py-0 owners-list">
    <v-row class="w-100 m-0 mb-5 filters">
      <v-col class="px-2" lg="auto" md="8" cols="4">
        <v-btn
          v-for="item in currencies"
          :key="item.id"
          :class="currency === item ? 'active' : ''"
          @click="changeCurrency(item)"
        >
          {{ item }}
        </v-btn>
      </v-col>
      <v-col class="px-2" lg="auto" md="8" cols="4">
        <v-btn
          :class="yearsSelected[currency].includes(5) ? 'active' : ''"
          @click="changeYearArr(5)"
        >
          5 YRS
        </v-btn>
        <v-btn
          :class="yearsSelected[currency].includes(10) ? 'active' : ''"
          @click="changeYearArr(10)"
        >
          10 YRS
        </v-btn>
        <v-btn
          :class="yearsSelected[currency].includes(40) ? 'active' : ''"
          @click="changeYearArr(40)"
        >
          40 YRS
        </v-btn>
      </v-col>
      <v-col class="px-2" lg="auto" md="8" cols="4">
        <v-btn
          :class="quoteType === 'Spread' ? 'active' : ''"
          @click="changeQuoteType('Spread')"
        >
          Spread
        </v-btn>
        <v-btn
          :class="quoteType === 'Yield' ? 'active' : ''"
          @click="changeQuoteType('Yield')"
        >
          Yield
        </v-btn>
        <v-btn
          :class="quoteType === '3MLSpread' ? 'active' : ''"
          @click="changeQuoteType('3MLSpread')"
        >
          3MLSpread
        </v-btn>
      </v-col>
    </v-row>

    <v-data-table
      :headers="Headers"
      fixed-header
      :items="items"
      item-key="id"
      :loading="!isDataLoaded"
      loading-text="Loading... Please wait"
      hide-default-footer
      :items-per-page="-1"
      sort-by="Company"
    >
      <template #top>
        <v-toolbar flat>
          <v-row class="mt-n3 w-100">
            <v-col class="px-2" lg="auto" md="8" cols="4">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Filter by company name ..."
                single-line
                hide-details
              >
              </v-text-field>
            </v-col>
          </v-row>
        </v-toolbar>
      </template>

<!--      <template v-slot:header.quoteFilter5YearsFix="{}">-->
<!--        <div>5 YRS</div>-->
<!--        <div class="separator-colored"></div>-->
<!--        <div>Fix</div>-->
<!--      </template>-->

      <template v-slot:item="props">
        <tr
          v-for="(item, index) in expendedItems[props.item.Id]
            ? [...new Set([quoteType, 'Spread', 'Yield', '3MLSpread'])]
            : [quoteType]"
          :key="props.item.Company + item"
          :class="{
            customRow: true,
            lastRow: Object.keys(props.item).length === 0,
          }"
        >
          <td class="dateCell">
            <v-icon
              v-if="
                index === 0 && props.item.Quote && !expendedItems[props.item.Id]
              "
              color="#000"
              @click="toggleRow(props.item.Id)"
            >
              mdi-chevron-right
            </v-icon>
            <v-icon
              v-if="
                index === 0 && props.item.Quote && expendedItems[props.item.Id]
              "
              color="#000"
              @click="toggleRow(props.item.Id)"
            >
              mdi-chevron-down
            </v-icon>
            <span v-if="index === 0">
              {{ formatDate(props.item.DateSent) }}
            </span>
          </td>
          <td class="nameCell">
            <span
              v-if="index === 0"
              :class="{ companyName: true, inactiveCompany: !props.item.Quote }"
            >
              {{ props.item.Company }}
            </span>
            <span v-else>
              {{ item }}
            </span>
          </td>
          <td
            v-if="yearsSelected[currency].includes(5)"
            :class="{
              'background-light':
                getQuoteData(props.item, [0, 5], currency, item, 'FIX') ===
                smallestValues['5'],
            }"
          >
            {{ generateQuoteData(props.item, [0, 5], currency, item, "FIX") }}
          </td>
          <td v-if="yearsSelected[currency].includes(5)">
            {{ generateQuoteData(props.item, [0, 5], currency, item, "FRN") }}
          </td>
          <td
            v-if="yearsSelected[currency].includes(10)"
            :class="{
              'background-light':
                getQuoteData(props.item, [0, 5], currency, item, 'FIX') ===
                smallestValues['10'],
            }"
          >
            {{ generateQuoteData(props.item, [5, 10], currency, item, "FIX") }}
          </td>
          <td v-if="yearsSelected[currency].includes(10)">
            {{ generateQuoteData(props.item, [5, 10], currency, item, "FRN") }}
          </td>
          <td
            v-if="yearsSelected[currency].includes(40)"
            :class="{
              'background-light':
                getQuoteData(props.item, [0, 5], currency, item, 'FIX') ===
                smallestValues['5'],
            }"
          >
            {{ generateQuoteData(props.item, [10, 40], currency, item, "FIX") }}
          </td>
          <td v-if="yearsSelected[currency].includes(40)">
            {{ generateQuoteData(props.item, [10, 40], currency, item, "FRN") }}
          </td>
        </tr>
        <div v-if="props.index === items.length - 1" class="separator"></div>
        <tr
          v-if="props.index === items.length - 1"
          class="customRow customFooter"
        >
          <td></td>
          <td>Average by {{ quoteType }}</td>
          <template v-for="(value, key) in averageData">
            <td v-for="item in ['FIX', 'FRN']" :key="key + item">
              {{
                quoteType === "Yield"
                  ? formatYieldValue(value[item])
                  : formatSpreadValue(value[item])
              }}
            </td>
          </template>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<style>
@import "../assets/css/table.css";
</style>
