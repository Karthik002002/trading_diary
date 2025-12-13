export const Icon = ({name,size}:{name:string,size:{height:number,width:number}}) => {
    return (
        <img src={`/icons/${name}.svg`} alt={name} height={size.height} width={size.width} />
    )
}