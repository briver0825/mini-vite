<template>
  <div>
    <h1>count:{{count}}</h1>
    <button @click="add">add</button>
  </div>
</template>

<script>
export default {
  data(){
    return{
      count:0
    }
  },
  methods: {
    add(){
      this.count++
    }
  },
}
</script>