#!/usr/local/bin/php
<?php
if (PHP_SAPI !== 'cli')
{
    exit("Use console");
}

require_once \dirname(__FILE__) . '/../../../system/autoload.php';

\Aurora\System\Api::Init();

$fd = fopen( "php://stdin", "r" );

$headers = "";

if ($fd)
{
    $sRawHeaders = '';
    while (trim($line = fgets($fd)) !== '')
    {
        $sRawHeaders .= $line;
    }

    $aHeaders = \explode("\n", \str_replace("\r", '', $sRawHeaders));

    $sName = null;
    $sValue = null;
    $aResult = [];
    foreach ($aHeaders as $sHeadersValue)
    {
        if (0 === strlen($sHeadersValue))
        {
            continue;
        }

        $sFirstChar = \substr($sHeadersValue, 0, 1);
        if ($sFirstChar !== ' ' && $sFirstChar !== "\t" && false === \strpos($sHeadersValue, ':'))
        {
            continue;
        }
        else if (null !== $sName && ($sFirstChar === ' ' || $sFirstChar === "\t"))
        {
            $sValue = \is_null($sValue) ? '' : $sValue;

            if ('?=' === \substr(\rtrim($sHeadersValue), -2))
            {
                $sHeadersValue = \rtrim($sHeadersValue);
            }

            if ('=?' === \substr(\ltrim($sHeadersValue), 0, 2))
            {
                $sHeadersValue = \ltrim($sHeadersValue);
            }

            if ('=?' === \substr($sHeadersValue, 0, 2))
            {
                $sValue .= $sHeadersValue;
            }
            else
            {
                $sValue .= "\n".$sHeadersValue;
            }
        }
        else
        {
            if (null !== $sName)
            {
                if (isset($aResult[$sName]))
                {
                    if (!is_array($aResult[$sName]))
                    {
                        $aResult[$sName] = [$aResult[$sName]];
                    }
                    $aResult[$sName][] = $sValue;
                }
                else
                {
                    $aResult[$sName] = $sValue;
                }

                $sName = null;
                $sValue = null;
            }

            $aHeaderParts = \explode(':', $sHeadersValue, 2);
            $sName = $aHeaderParts[0];
            $sValue = isset($aHeaderParts[1]) ? $aHeaderParts[1] : '';

            if ('?=' === \substr(\rtrim($sValue), -2))
            {
                $sValue = \rtrim($sValue);
            }
        }
    }
    if (null !== $sName)
    {
        $aResult[$sName] = \trim($sValue);
    }
    \Aurora\System\Api::Log("Message headers", \Aurora\System\Enums\LogLevel::Full, 'push-');
    \Aurora\System\Api::Log(\json_encode($aResult), \Aurora\System\Enums\LogLevel::Full, 'push-');

    $isSpam = isset($aResult['X-Spam-Flag']) && $aResult['X-Spam-Flag'] === 'TRUE' ? true : false;
    if (!$isSpam)
    {
        $sEmail = null;
        if (isset($aResult['Received']))
        {
            $sMatch = null;
            if (is_array($aResult['Received']))
            {
                foreach ($aResult['Received'] as $sReceived)
                {
                    if (preg_match('/for (.*);/si', $sReceived, $matches))
                    {
                        $sMatch = $matches[1];
                        break;
                    }
                }
            }
            else
            {
                if (preg_match('/for (.*);/si', $aResult['Received'], $matches))
                {
                    $sMatch = $matches[1];
                }
            }
            if (isset($sMatch))
            {
                $sEmail = \rtrim(\ltrim($matches[1], '<'), '>');

            }
        } else {
			\Aurora\System\Api::Log('"Received" header is not found.', \Aurora\System\Enums\LogLevel::Full, 'push-');
		}
        if (!isset($sEmail))
        {
            if (isset($aResult['Delivered-To']))
            {
                $sEmail = \rtrim(\ltrim($aResult['Delivered-To'], '<'), '>');
            } else {
				\Aurora\System\Api::Log('"Delivered-To" header is not found.', \Aurora\System\Enums\LogLevel::Full, 'push-');
			}
        }
        $sFrom = '';
        if (isset($aResult['From']))
        {
            $sFrom = \trim($aResult['From']);
        }
        $sSubject = '';
        if (isset($aResult['Subject']))
        {
            $sSubject = \trim($aResult['Subject']);
        }
        if (empty($sEmail))
        {
            \Aurora\System\Api::Log('Recipient address is not found.', \Aurora\System\Enums\LogLevel::Full, 'push-');
        }
        else if (empty($sFrom) && empty($sSubject))
        {
            \Aurora\System\Api::Log('"From" and "Subject" headers are not found in the mail message.', \Aurora\System\Enums\LogLevel::Full, 'push-');
        }
        else
        {
            $aPushMessageData = [
                'From' => $sFrom,
                'To' => $sEmail,
                'Subject' => $sSubject,
                'Folder' => 'INBOX'
            ];

            if (isset($aResult['Message-ID']))
            {
                $aPushMessageData['MessageId'] = \trim($aResult['Message-ID']);
            }
            else
            {
                \Aurora\System\Api::Log('"Message-ID" header is not found.', \Aurora\System\Enums\LogLevel::Full, 'push-');
            }
            
            $Data = [
                'Email' => $sEmail,
                'Data' => [$aPushMessageData]
            ];

            $Secret = \Aurora\System\Api::GetModule('PushNotificator')->getConfig('Secret', '');
            \Aurora\System\Api::Log(\json_encode([$Data]), \Aurora\System\Enums\LogLevel::Full, 'push-');
            \Aurora\Modules\PushNotificator\Module::Decorator()->SendPush($Secret, [$Data]);
        }
    }
}
