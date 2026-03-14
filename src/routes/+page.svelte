<script lang="ts">

    let {data} = $props()
</script>

<h1>Customers</h1>

<table>
    <thead><tr><th>id</th><th>name</th></tr></thead>
    <tbody>
        {#each data.customers as customer}
            <tr>
                <td>{customer.customerid}</td>
                <td>{customer.display_name}</td>
            </tr>
        {:else}
            <tr>
                <td colspan="2">No customers found.</td>
            </tr>
         {/each}
    </tbody>
</table>