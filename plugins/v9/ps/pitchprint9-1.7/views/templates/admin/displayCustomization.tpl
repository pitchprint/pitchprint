<style>
    .pp-90thumb {
        width: 90px;
    }
</style>
{if ($pp_customization.type == 'p')}
    {for $j=1 to $pp_customization.numPages}
        <a class="ppc-ps-img"><img src="https://pitchprint.io/previews/{$pp_customization.projectId}_{$j}.jpg" class="pp-90thumb" ></a>
    {/for}
{else}
    {foreach from=$pp_customization.previews key=k item=v}
        <a class="ppc-ps-img"><img src="{$v}" class="pp-90thumb" ></a>
    {/foreach}
{/if}

<div style="display: inline-block; -webkit-inline-box; vertical-align: top; margin-top:10px;">
    {if ($pp_customization.type == 'u')}
        {foreach from=$pp_customization.files key=k item=v}
            <a target="_blank" href="{$v}" >File {$k+1}</a> &nbsp;&nbsp;&nbsp;
        {/foreach}
    {else}
        &#8226; <a target="_blank" href="http://pdf.pitchprint.io/?id={$pp_customization.projectId}">Download PDF File</a>
        <br/>
        &#8226; <a target="_blank" href="http://pdf.pitchprint.io/?id={$pp_customization.projectId}&raster=1" >Download Raster Renderings</a>
        {if !empty($pp_customization.userId)}
            <br/>&#8226; <a target="_blank" href="https://admin.pitchprint.io/projects?p={$pp_customization.projectId}&u={$pp_customization.userId}">Load Project and Modify</a>
        {/if}

    {/if}

</div>

