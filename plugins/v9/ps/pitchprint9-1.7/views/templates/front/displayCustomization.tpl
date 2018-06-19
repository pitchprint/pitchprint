<div class="pp-customization">
{if ($pp_customization.type == 'p')}
    {for $j=1 to $pp_customization.numPages}
        <a class="ppc-ps-img"><img src="https://pitchprint.io/previews/{$pp_customization.projectId}_{$j}.jpg" class="pp-90thumb" ></a>
    {/for}
{else}
    {foreach from=$pp_customization.previews key=k item=v}
        <a class="ppc-ps-img"><img src="{$v}" class="pp-90thumb" ></a>
    {/foreach}
{/if}
</div>
