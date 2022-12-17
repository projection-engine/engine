export default `
<style>
/*For no class conflict use pattern ".class.suffix-class" (replacing "class" and "suffix-class" with the name you want*/
.my-class.this-file{
    background: green;
    width: fit-content;
    height: 50px;
    border-radius: 5px;
}
</style>
<div class="my-class this-file">
    Example text (You can declare raw html here)
</div>
`