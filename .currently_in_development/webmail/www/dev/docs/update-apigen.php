<?php
echo "Start documentation custom process \r\n";

include "parsedown.php";

$sDocsPath = dirname(__File__);
$sRootPath = dirname(dirname($sDocsPath));

$sMdFile = $sRootPath.'/apigen-overview.md';
$sDocsFile = $sRootPath.'/docs/api/index.html';


if (file_exists($sMdFile) && file_exists($sDocsFile))
{
	$sMdText = file_get_contents($sMdFile);
	
	$Parsedown = new Parsedown();
	$sOverviewtext = $Parsedown->text($sMdText);
	
	$sDoc = file_get_contents($sDocsFile);
	
	if ($sOverviewtext && $sDoc) 
	{
		$sDoc = preg_replace("/id=\"content\".*(?:\r)*(?:\n)*.*<\/h1>/", "$0" . $sOverviewtext, $sDoc);
		file_put_contents($sDocsFile, $sDoc);
		
		echo "Overview was saccessully added \r\n";
	}
	else
	{
		echo "Can't insert overview \r\n";
	}
}
else
{
	echo "apigen-overview.md or documentation not found \r\n";
}